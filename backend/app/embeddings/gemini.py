import os
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
        self._model = model or settings.EMBEDDING_MODEL
        self._dimension = dimension or settings.EMBEDDING_DIMENSION
        self._batch_size = batch_size or settings.EMBEDDING_BATCH_SIZE
        
        if not self._api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        self.client = genai.Client(api_key=self._api_key)

    @property
    def dimension(self) -> int:
        return self._dimension
        
    @property
    def model_name(self) -> str:
        return self._model

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(APIError),
        reraise=True
    )
    def _call_embed_api(self, contents: List[str]) -> List[List[float]]:
        logger.info(f"Calling Gemini API to embed {len(contents)} texts.")
        try:
            response = self.client.models.embed_content(
                model=self._model,
                contents=contents,
                config=types.EmbedContentConfig(output_dimensionality=self._dimension)
            )
            # response.embeddings is a list of EmbedContentResponseEmbedding objects
            # each has a .values attribute containing the floats
            return [emb.values for emb in response.embeddings]
        except Exception as e:
            logger.warning(f"Failed to embed batch with Gemini API: {str(e)}")
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
            
        return all_embeddings

    def embed_text(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]
