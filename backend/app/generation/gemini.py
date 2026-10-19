import time
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings
from app.core.logging import logger
from app.generation.base import LLMProvider
from app.schemas.generation import GenerationResult, Citation, RawSourceItem
from app.rag.models import ContextPackage
from app.rag.serializer import ContextSerializer
from app.generation.prompts import GROUNDED_SYSTEM_PROMPT

class GeminiProvider(LLMProvider):
    def __init__(self):
        # We allow missing key to be handled safely instead of crashing on import
        self.api_key = getattr(settings, "GEMINI_API_KEY", None)
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash")
        self.temperature = getattr(settings, "GEMINI_TEMPERATURE", 0.0)
        self.max_output_tokens = getattr(settings, "GEMINI_MAX_OUTPUT_TOKENS", 2048)
        self.timeout = getattr(settings, "GEMINI_TIMEOUT", 30.0)
        self.serializer = ContextSerializer()
        
        if self.api_key and self.api_key != "your_api_key_here":
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.error("GEMINI_API_KEY is not correctly set.")

    def generate(self, query: str, context: ContextPackage, generation_config: Dict[str, Any] = None) -> GenerationResult:
        start_time = time.time()
        
        # 1. Handle insufficient context
        if not context.items:
            logger.info("Context is empty. Returning insufficient evidence response.")
            return GenerationResult(
                answer="The available documents do not contain enough information to answer this question.",
                citations=[],
                raw_sources=[],
                model=self.model_name,
                finish_reason="insufficient_context",
                input_context_items=0,
                generation_latency_ms=(time.time() - start_time) * 1000
            )
            
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
            
        # 2. Serialize context
        serialized_context = self.serializer.serialize(context)
        system_instruction = GROUNDED_SYSTEM_PROMPT.format(serialized_context=serialized_context)
        
        # 3. Call Gemini with Bounded Retry (Max 3 attempts for transient errors, fail fast on permanent 400)
        max_attempts = 3
        attempt = 0
        base_delay = 1.0
        response = None
        last_error = None
        used_model = self.model_name

        while attempt < max_attempts:
            attempt += 1
            try:
                response = self.client.models.generate_content(
                    model=used_model,
                    contents=query,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=self.temperature,
                        max_output_tokens=self.max_output_tokens
                    )
                )
                break  # Success
                
            except APIError as e:
                code = getattr(e, "code", None)
                last_error = e
                # Permanent client error (400) - do not retry
                if code == 400:
                    logger.error(f"Gemini API Permanent Error on {used_model}: {e}")
                    raise RuntimeError(f"Upstream provider error: {e}")
                
                # Transient error (503, 429, 500, etc.)
                logger.warning(
                    f"Gemini API transient failure on {used_model}: {code}",
                    extra={"attempt": attempt, "error_type": code}
                )
                if attempt < max_attempts:
                    time.sleep(base_delay * (2 ** (attempt - 1)))
                    continue
                else:
                    raise RuntimeError(f"Upstream provider error: Gemini max retries exceeded: {e}")
                
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "timed out" in err_str or "connection" in err_str or "ssl" in err_str:
                    logger.warning(
                        f"Gemini API network transient failure on {used_model}: {e}",
                        extra={"attempt": attempt}
                    )
                    if attempt < max_attempts:
                        time.sleep(base_delay)
                        continue
                logger.error(f"Unexpected error calling Gemini on {used_model}: {e}")
                raise RuntimeError(f"Upstream provider error: {e}")

        # 4. Validate response
        if not response or not response.text:
            err_msg = str(last_error) if last_error else "Provider returned an empty response."
            raise RuntimeError(f"Upstream provider error: Gemini synthesis failed: {err_msg}")
            
        answer_text = response.text
        
        # 5. Extract citations and map to context items
        citations = self._extract_citations(answer_text, context)
        
        # 6. Build raw sources list for hybrid evidence transparency
        raw_sources = []
        for i, item in enumerate(context.items, 1):
            sec = item.metadata.get("section") or item.metadata.get("heading") or item.metadata.get("title")
            raw_sources.append(RawSourceItem(
                source_id=f"Source {i}",
                document_id=item.document_id,
                filename=item.filename,
                page_number=item.page_number,
                chunk_id=item.chunk_id,
                chunk_index=item.chunk_index,
                content=item.content,
                similarity=round(item.similarity, 4),
                section=sec,
                source_type=item.source_type
            ))
        
        latency_ms = (time.time() - start_time) * 1000
        
        return GenerationResult(
            answer=answer_text,
            citations=citations,
            raw_sources=raw_sources,
            model=used_model,
            finish_reason="stop",
            input_context_items=len(context.items),
            generation_latency_ms=latency_ms
        )
        
    def _extract_citations(self, text: str, context: ContextPackage) -> List[Citation]:
        # Regex to find [Source X] or [X] patterns
        pattern = r"\[(?:Source\s*)?(\d+)\]"
        matches = sorted(list(set(re.findall(pattern, text))), key=lambda x: int(x))
        
        citations = []
        for match in matches:
            try:
                idx = int(match) - 1
                if 0 <= idx < len(context.items):
                    item = context.items[idx]
                    sec = item.metadata.get("section") or item.metadata.get("heading") or item.metadata.get("title")
                    citations.append(Citation(
                        source_id=f"Source {match}",
                        document_id=item.document_id,
                        filename=item.filename,
                        page_number=item.page_number,
                        chunk_id=item.chunk_id,
                        chunk_index=item.chunk_index,
                        snippet=item.content,
                        similarity_score=round(item.similarity, 4),
                        section=sec,
                        source_type=item.source_type
                    ))
                else:
                    logger.warning(f"Gemini generated invalid citation index: {match}")
            except ValueError:
                pass
                
        return citations
