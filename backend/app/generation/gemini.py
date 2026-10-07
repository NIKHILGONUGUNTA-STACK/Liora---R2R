import time
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings
from app.core.logging import logger
from app.generation.base import LLMProvider
from app.schemas.generation import GenerationResult, Citation
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
            self.client = genai.Client(
                api_key=self.api_key,
                http_options={"timeout": self.timeout}
            )
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
        
        # 3. Call Gemini with Bounded Retry
        max_attempts = 3
        attempt = 0
        base_delay = 1.0
        response = None
        
        while attempt < max_attempts:
            attempt += 1
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=query,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=self.temperature,
                        max_output_tokens=self.max_output_tokens
                    )
                )
                break  # Success
                
            except APIError as e:
                # Retry only on specific transient HTTP errors
                # code is an integer (e.g., 429, 503)
                code = getattr(e, "code", None)
                if code in [429, 500, 502, 503, 504]:
                    logger.warning(
                        "Gemini API transient failure",
                        extra={
                            "provider": "gemini",
                            "attempt": attempt,
                            "max_attempts": max_attempts,
                            "error_type": code,
                            "reason": getattr(e, "message", "UNKNOWN")
                        }
                    )
                    if attempt < max_attempts:
                        time.sleep(base_delay * (2 ** (attempt - 1)))  # Exponential backoff
                        continue
                
                # If not retriable or out of attempts
                logger.error(
                    "Gemini API Error",
                    extra={
                        "provider": "gemini",
                        "attempt": attempt,
                        "error_type": code,
                        "reason": getattr(e, "message", "UNKNOWN")
                    }
                )
                raise RuntimeError("Upstream provider error.") from None
                
            except Exception as e:
                err_str = str(e).lower()
                if "timed out" in err_str or "connection" in err_str or "ssl" in err_str:
                    logger.warning(
                        "Gemini API network transient failure",
                        extra={
                            "provider": "gemini",
                            "attempt": attempt,
                            "max_attempts": max_attempts,
                            "error_type": "network_error",
                            "reason": str(e)
                        }
                    )
                    if attempt < max_attempts:
                        time.sleep(base_delay * (2 ** (attempt - 1)))  # Exponential backoff
                        continue
                
                logger.error(f"Unexpected error calling Gemini: {e}")
                raise RuntimeError("Upstream provider error.") from None
                
        # 4. Extract and validate response
        if not response or not response.text:
            raise RuntimeError("Upstream provider returned an empty response.")
            
        answer_text = response.text
        
        # 5. Extract citations and map to context items
        citations = self._extract_citations(answer_text, context)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return GenerationResult(
            answer=answer_text,
            citations=citations,
            model=self.model_name,
            finish_reason="stop",
            input_context_items=len(context.items),
            generation_latency_ms=latency_ms
        )
        
    def _extract_citations(self, text: str, context: ContextPackage) -> List[Citation]:
        # Regex to find [Source X] patterns
        pattern = r"\[Source (\d+)\]"
        matches = set(re.findall(pattern, text))
        
        citations = []
        for match in matches:
            try:
                idx = int(match) - 1
                if 0 <= idx < len(context.items):
                    item = context.items[idx]
                    citations.append(Citation(
                        source_id=f"Source {match}",
                        document_id=item.document_id,
                        filename=item.filename,
                        page_number=item.page_number,
                        chunk_id=item.chunk_id,
                        chunk_index=item.chunk_index
                    ))
                else:
                    logger.warning(f"Gemini generated invalid citation index: {match}")
            except ValueError:
                pass
                
        return citations
