from typing import List
from sentence_transformers import SentenceTransformer
import numpy as np

from app.embeddings.base import EmbeddingProvider
from app.core.config import settings
from app.core.logging import logger
import threading

class LocalQwenEmbeddingProvider(EmbeddingProvider):
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, *args, **kwargs):
        # Singleton pattern to avoid reloading the model
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(LocalQwenEmbeddingProvider, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, model_name: str = None, dimension: int = None, device: str = None, batch_size: int = None):
        # Only initialize once
        if getattr(self, '_initialized', False):
            return
            
        self._model_name = model_name or settings.EMBEDDING_MODEL
        self._dimension = dimension or settings.EMBEDDING_DIMENSION
        self._device = device or settings.EMBEDDING_DEVICE
        self._batch_size = batch_size or settings.EMBEDDING_BATCH_SIZE
        self._query_instruction = getattr(settings, "EMBEDDING_QUERY_INSTRUCTION", "")
        
        logger.info(f"Loading local embedding model: {self._model_name} on {self._device}...")
        self._model = SentenceTransformer(self._model_name, device=self._device)
        logger.info(f"Model {self._model_name} loaded successfully.")
        
        self._initialized = True

    @property
    def dimension(self) -> int:
        return self._dimension
        
    @property
    def model_name(self) -> str:
        return self._model_name

    def _validate_embeddings(self, embeddings: np.ndarray) -> List[List[float]]:
        emb_list = embeddings.tolist()
        
        for emb in emb_list:
            if len(emb) != self._dimension:
                raise ValueError(f"Expected embedding dimension {self._dimension}, got {len(emb)}")
            for v in emb:
                if not isinstance(v, (int, float)):
                    raise ValueError("Non-numeric value in embedding")
                import math
                if math.isnan(v) or math.isinf(v):
                    raise ValueError("NaN or Inf value in embedding")
                    
        return emb_list

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed document texts."""
        if not texts:
            return []
            
        if any(not text.strip() for text in texts):
            raise ValueError("Encountered empty text in embedding batch")
            
        logger.info(f"Embedding {len(texts)} document texts using {self._model_name}...")
        # SentenceTransformer handles batching internally, but we can respect our config batch_size
        embeddings = self._model.encode(
            texts, 
            batch_size=self._batch_size, 
            normalize_embeddings=True,
            show_progress_bar=False
        )
        return self._validate_embeddings(embeddings)

    def embed_text(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]
        
    def embed_query(self, query: str) -> List[float]:
        """Embed a query text, prepending the instruction if configured."""
        if not query.strip():
            raise ValueError("Empty query")
            
        text_to_embed = f"{self._query_instruction}{query}" if self._query_instruction else query
        
        logger.info(f"Embedding query using {self._model_name}...")
        embeddings = self._model.encode(
            [text_to_embed], 
            batch_size=1, 
            normalize_embeddings=True,
            show_progress_bar=False
        )
        return self._validate_embeddings(embeddings)[0]
