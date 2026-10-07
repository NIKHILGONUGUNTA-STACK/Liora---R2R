from app.core.config import settings
from app.embeddings.base import EmbeddingProvider
from app.core.logging import logger

def get_embedding_provider() -> EmbeddingProvider:
    provider_type = getattr(settings, "EMBEDDING_PROVIDER", "qwen_local").lower()
    
    if provider_type == "qwen_local":
        from app.embeddings.local_qwen import LocalQwenEmbeddingProvider
        return LocalQwenEmbeddingProvider()
    elif provider_type == "gemini":
        from app.embeddings.gemini import GeminiEmbeddingProvider
        return GeminiEmbeddingProvider()
    else:
        logger.warning(f"Unknown provider '{provider_type}', falling back to qwen_local")
        from app.embeddings.local_qwen import LocalQwenEmbeddingProvider
        return LocalQwenEmbeddingProvider()
