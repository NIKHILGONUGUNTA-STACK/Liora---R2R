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
        
        # 3. Call Gemini with Model Fallback and Bounded Retry
        # Prepare candidate models to handle transient 503 high demand or 404 deprecations
        raw_candidates = [self.model_name, "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.8-flash"]
        candidate_models = []
        for m in raw_candidates:
            if m and m not in candidate_models:
                candidate_models.append(m)

        response = None
        used_model = self.model_name
        last_error = None

        for model_to_try in candidate_models:
            max_attempts = 2
            attempt = 0
            base_delay = 1.0
            model_succeeded = False

            while attempt < max_attempts:
                attempt += 1
                try:
                    response = self.client.models.generate_content(
                        model=model_to_try,
                        contents=query,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=self.temperature,
                            max_output_tokens=self.max_output_tokens
                        )
                    )
                    used_model = model_to_try
                    model_succeeded = True
                    break  # Success
                    
                except APIError as e:
                    code = getattr(e, "code", None)
                    last_error = e
                    # If model is unavailable (503) or discontinued (404), break immediately to next model
                    if code in [404, 503]:
                        logger.warning(
                            f"Model {model_to_try} returned {code}. Attempting fallback model...",
                            extra={"provider": "gemini", "model": model_to_try, "error_code": code}
                        )
                        break
                    
                    if code in [429, 500, 502, 504]:
                        logger.warning(
                            f"Gemini API transient failure on {model_to_try}: {code}",
                            extra={"attempt": attempt, "error_type": code}
                        )
                        if attempt < max_attempts:
                            time.sleep(base_delay * (2 ** (attempt - 1)))
                            continue
                    
                    logger.error(f"Gemini API Error on {model_to_try}: {e}")
                    break
                    
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    if "timed out" in err_str or "connection" in err_str or "ssl" in err_str:
                        logger.warning(
                            f"Gemini API network transient failure on {model_to_try}: {e}",
                            extra={"attempt": attempt}
                        )
                        if attempt < max_attempts:
                            time.sleep(base_delay)
                            continue
                    logger.error(f"Unexpected error calling Gemini on {model_to_try}: {e}")
                    break

            if model_succeeded and response and response.text:
                break

        # 4. Validate response
        if not response or not response.text:
            err_msg = str(last_error) if last_error else "Provider returned an empty response."
            raise RuntimeError(f"Gemini synthesis failed: {err_msg}")
            
        answer_text = response.text
        
        # 5. Extract citations and map to context items
        citations = self._extract_citations(answer_text, context)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return GenerationResult(
            answer=answer_text,
            citations=citations,
            model=used_model,
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
