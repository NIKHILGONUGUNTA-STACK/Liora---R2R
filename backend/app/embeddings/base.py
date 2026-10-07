from abc import ABC, abstractmethod
from typing import List

class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers."""
    
    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of texts and returns a list of embedding vectors.
        Output order must perfectly match input order.
        """
        pass
        
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """
        Embeds a single text.
        """
        pass
        
    @property
    @abstractmethod
    def dimension(self) -> int:
        """The expected dimension of the generated vectors."""
        pass
        
    @property
    @abstractmethod
    def model_name(self) -> str:
        """The identifier of the configured embedding model."""
        pass
