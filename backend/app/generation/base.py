from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.schemas.generation import GenerationResult
from app.rag.models import ContextPackage

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, query: str, context: ContextPackage, generation_config: Dict[str, Any] = None) -> GenerationResult:
        """
        Generate a grounded answer based on the provided query and context.
        """
        pass
