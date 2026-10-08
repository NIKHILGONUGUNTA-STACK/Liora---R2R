from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.query import QueryAnalysis

class QueryUnderstandingProvider(ABC):
    @abstractmethod
    def analyze_and_rewrite(self, query: str) -> QueryAnalysis:
        pass
