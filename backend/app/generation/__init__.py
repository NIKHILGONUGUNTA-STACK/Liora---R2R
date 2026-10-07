from app.generation.base import LLMProvider
from app.generation.gemini import GeminiProvider

def get_llm_provider() -> LLMProvider:
    return GeminiProvider()
