import os
import time
import re
from typing import List
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.embeddings.base import EmbeddingProvider
from app.core.config import settings
from app.core.logging import logger

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str = None, model: str = None, dimension: int = None, batch_size: int = None):
        self._api_key = api_key or settings.GEMINI_API_KEY
        raw_model = model or getattr(settings, "GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
        if not raw_model.startswith("models/"):
            raw_model = f"models/{raw_model}"
        if "text-embedding-004" in raw_model or "qwen" in raw_model.lower():
            raw_model = "models/gemini-embedding-001"
        self._model = raw_model
        self._dimension = dimension or getattr(settings, "EMBEDDING_DIMENSION", 1024)
        self._batch_size = batch_size or getattr(settings, "EMBEDDING_BATCH_SIZE", 32)
        
        if not self._api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        self.client = genai.Client(api_key=self._api_key)

    @property
    def dimension(self) -> int:
        return self._dimension
        
    @property
    def model_name(self) -> str:
        return self._model

    def _call_embed_api(self, contents: List[str]) -> List[List[float]]:
        logger.info(f"Calling Gemini API to embed {len(contents)} texts.")
        max_attempts = 5
        base_delay = 2.0

        for attempt in range(1, max_attempts + 1):
            try:
                response = self.client.models.embed_content(
                    model=self._model,
                    contents=contents,
                    config=types.EmbedContentConfig(output_dimensionality=self._dimension)
                )
                return [emb.values for emb in response.embeddings]
            except Exception as e:
                err_str = str(e)
                is_rate_limit = (
                    "429" in err_str
                    or "RESOURCE_EXHAUSTED" in err_str
                    or "quota" in err_str.lower()
                )

                if is_rate_limit and attempt < max_attempts:
                    # Parse retry delay if provided in the error message (e.g. retryDelay: '16s' or retry in 16.3s)
                    wait_seconds = 20.0
                    match = re.search(r"retry(?:Delay| in)?[:\s'\"]*([0-9]+(?:\.[0-9]+)?)s?", err_str, re.IGNORECASE)
                    if match:
                        try:
                            wait_seconds = float(match.group(1)) + 2.0  # add 2s safety buffer
                        except ValueError:
                            wait_seconds = 20.0
                    else:
                        wait_seconds = min(60.0, base_delay * (2 ** (attempt - 1)) + 10.0)

                    logger.warning(
                        f"Gemini API rate limit reached (Free tier 100 RPM limit). "
                        f"Waiting {wait_seconds:.1f}s for quota reset (attempt {attempt}/{max_attempts})..."
                    )
                    time.sleep(wait_seconds)
                    continue

                if ("timed out" in err_str.lower() or "connection" in err_str.lower()) and attempt < max_attempts:
                    time.sleep(base_delay * attempt)
                    continue

                logger.error(f"Failed to embed batch with Gemini API (attempt {attempt}): {err_str}")
                raise

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
            
        all_embeddings = []
        
        # Batch processing
        for i in range(0, len(texts), self._batch_size):
            batch = texts[i:i + self._batch_size]
            
            # Validation: do not embed empty strings
            if any(not text.strip() for text in batch):
                raise ValueError("Encountered empty text in embedding batch")
                
            batch_embeddings = self._call_embed_api(batch)
            
            if len(batch_embeddings) != len(batch):
                raise ValueError(f"Provider returned {len(batch_embeddings)} vectors for {len(batch)} inputs.")
                
            for emb in batch_embeddings:
                if len(emb) != self._dimension:
                    raise ValueError(f"Expected embedding dimension {self._dimension}, got {len(emb)}")
                    
            all_embeddings.extend(batch_embeddings)
            
            # Inter-batch pause (250ms) to pace requests within free-tier threshold
            if i + self._batch_size < len(texts):
                time.sleep(0.25)
            
        return all_embeddings

    def embed_text(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]
