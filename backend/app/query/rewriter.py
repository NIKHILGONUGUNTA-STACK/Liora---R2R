import time
import json
from pydantic import BaseModel
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings
from app.core.logging import logger
from app.schemas.query import QueryAnalysis
from app.query.base import QueryUnderstandingProvider
from app.query.analyzer import QueryAnalyzer
from app.query.prompts import REWRITE_SYSTEM_PROMPT

class RewriteSchema(BaseModel):
    query_type: str
    requires_rewrite: bool
    rewritten_query: str
    rewrite_reason: str

class GeminiQueryRewriter(QueryUnderstandingProvider):
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", None)
        self.model_name = getattr(settings, "QUERY_REWRITE_MODEL", "gemini-3.8-flash")
        self.timeout = getattr(settings, "QUERY_REWRITE_TIMEOUT", 15.0)
        self.max_retries = getattr(settings, "QUERY_REWRITE_MAX_RETRIES", 1)
        self.enabled = getattr(settings, "QUERY_REWRITING_ENABLED", True)
        
        if self.api_key and self.api_key != "your_api_key_here":
            self.client = genai.Client(
                api_key=self.api_key,
                http_options={"timeout": self.timeout}
            )
        else:
            self.client = None
            logger.error("GEMINI_API_KEY is not correctly set. Query rewriting disabled.")
            self.enabled = False

    def analyze_and_rewrite(self, query: str) -> QueryAnalysis:
        start_time = time.perf_counter()
        
        # 1. Deterministic Normalization
        normalized = QueryAnalyzer.normalize(query)
        
        # Fast path for very short queries (less than 3 words) or disabled config
        words = normalized.split()
        if not self.enabled or not self.client or len(words) <= 3:
            return QueryAnalysis(
                original_query=query,
                normalized_query=normalized,
                rewritten_query=normalized,
                query_type="factual" if len(words) <= 3 else "ambiguous",
                requires_rewrite=False,
                rewrite_latency_ms=(time.perf_counter() - start_time) * 1000
            )
            
        # 2. Rewrite via LLM
        attempt = 0
        response_text = None
        
        while attempt <= self.max_retries:
            attempt += 1
            try:
                # We request JSON structured output
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=normalized,
                    config=types.GenerateContentConfig(
                        system_instruction=REWRITE_SYSTEM_PROMPT,
                        temperature=0.0,
                        response_mime_type="application/json",
                    )
                )
                response_text = response.text
                break
                
            except Exception as e:
                logger.warning(
                    f"Query rewrite failed: {e}",
                    extra={
                        "attempt": attempt,
                        "query": normalized
                    }
                )
                if attempt > self.max_retries:
                    # Fallback to normalized on total failure
                    logger.error("Query rewrite max retries reached. Using fallback.")
                    return QueryAnalysis(
                        original_query=query,
                        normalized_query=normalized,
                        rewritten_query=normalized,
                        query_type="unknown",
                        requires_rewrite=False,
                        rewrite_reason="fallback due to API failure",
                        rewrite_latency_ms=(time.perf_counter() - start_time) * 1000,
                        fallback_used=True
                    )
        
        # 3. Parse JSON response
        try:
            parsed = json.loads(response_text)
            requires_rewrite = parsed.get("requires_rewrite", False)
            rewritten_query = parsed.get("rewritten_query", normalized)
            
            # Additional safety: if rewrite is malicious/empty, fallback
            if not rewritten_query or len(rewritten_query.strip()) == 0:
                rewritten_query = normalized
                requires_rewrite = False
                
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"Query analysis complete | rewritten: {requires_rewrite} | type: {parsed.get('query_type')} | lat: {latency_ms:.1f}ms")
                
            return QueryAnalysis(
                original_query=query,
                normalized_query=normalized,
                rewritten_query=rewritten_query if requires_rewrite else normalized,
                query_type=parsed.get("query_type", "factual"),
                requires_rewrite=requires_rewrite,
                rewrite_reason=parsed.get("rewrite_reason"),
                rewrite_latency_ms=latency_ms
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse rewrite output: {response_text}. Fallback used.")
            return QueryAnalysis(
                original_query=query,
                normalized_query=normalized,
                rewritten_query=normalized,
                query_type="unknown",
                requires_rewrite=False,
                rewrite_reason="fallback due to JSON parsing failure",
                rewrite_latency_ms=(time.perf_counter() - start_time) * 1000,
                fallback_used=True
            )
