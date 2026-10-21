from app.embeddings.base import EmbeddingProvider
from app.embeddings.gemini import GeminiEmbeddingProvider
from app.core.logging import logger

def get_embedding_provider() -> EmbeddingProvider:
    """
    Returns the high-performance Gemini Embedding Provider (models/gemini-embedding-001, 1024 dim).
    Local Qwen CPU embedding has been decommissioned to ensure near-zero latency and minimal RAM usage.
    """
    return GeminiEmbeddingProvider()
