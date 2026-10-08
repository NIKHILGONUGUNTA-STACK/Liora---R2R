from abc import ABC, abstractmethod
from typing import List
from app.schemas.search import SearchResult

class Reranker(ABC):
    @abstractmethod
    def rerank(self, query: str, candidates: List[SearchResult], top_k: int) -> List[SearchResult]:
        pass
