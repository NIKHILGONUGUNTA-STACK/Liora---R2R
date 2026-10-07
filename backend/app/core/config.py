from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Chunking configuration
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120
    
    # Removed duplicates below, consolidated under LLM & Embeddings
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL Connection String")
    
    # LLM & Embeddings
    GEMINI_API_KEY: str = Field(..., description="Gemini API Key")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TEMPERATURE: float = 0.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048
    GEMINI_TIMEOUT: float = 30.0
    
    # Embedding Configuration
    EMBEDDING_PROVIDER: str = "qwen_local"
    EMBEDDING_MODEL: str = "Qwen/Qwen3-Embedding-0.6B"
    EMBEDDING_DIMENSION: int = 1024
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_QUERY_INSTRUCTION: str = "Given a web search query, retrieve relevant passages that answer the query: "
    
    # RAG Settings
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K: int = 5
    MAX_CONTEXT_TOKENS: int = 4096
    
    # Layer 9 Context Assembly
    MAX_CONTEXT_CHUNKS: int = 5
    MAX_CONTEXT_CHARS: int = 12000
    MIN_RELEVANCE_SCORE: float = 0.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
