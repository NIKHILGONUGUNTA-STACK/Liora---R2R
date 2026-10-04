from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> Any:
        pass
        
    @abstractmethod
    async def stream(self, prompt: str, **kwargs) -> AsyncGenerator[Any, None]:
        pass
