from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Chunking configuration
    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 150
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL Connection String")
    
    # LLM & Embeddings
    GEMINI_API_KEY: str = Field(..., description="Gemini API Key")
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_TEMPERATURE: float = 0.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048
    GEMINI_TIMEOUT: float = 30.0
    
    # Embedding Configuration
    EMBEDDING_PROVIDER: str = "gemini"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_DIMENSION: int = 1024
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_QUERY_INSTRUCTION: str = "Given a web search query, retrieve relevant passages that answer the query: "
    
    # RAG Settings
    TOP_K: int = 5
    MAX_CONTEXT_TOKENS: int = 4096
    
    # Layer 9 Context Assembly
    MAX_CONTEXT_CHUNKS: int = 5
    MAX_CONTEXT_CHARS: int = 12000
    MIN_RELEVANCE_SCORE: float = 0.0

    # Layer 11 Hybrid Retrieval Settings
    RETRIEVAL_MODE: str = "hybrid"
    DENSE_TOP_K: int = 10
    KEYWORD_TOP_K: int = 10
    FINAL_TOP_K: int = 5
    RRF_K: int = 60

    # Layer 12 Reranking Settings
    RERANKING_ENABLED: bool = True
    RERANKER_PROVIDER: str = "cross_encoder"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    RERANKER_CANDIDATE_TOP_K: int = 20
    RERANKER_FINAL_TOP_K: int = 5

    # Layer 13 Query Understanding Settings
    QUERY_REWRITING_ENABLED: bool = True
    QUERY_REWRITE_PROVIDER: str = "gemini"
    QUERY_REWRITE_MODEL: str = "gemini-3.5-flash"
    QUERY_REWRITE_TIMEOUT: float = 15.0
    QUERY_REWRITE_MAX_RETRIES: int = 1

    # Layer 14 Advanced Context Settings
    CONTEXT_EXPANSION_ENABLED: bool = True
    CONTEXT_NEIGHBOR_WINDOW: int = 1
    CONTEXT_EXPANSION_MAX_BASE_RESULTS: int = 3
    CONTEXT_MAX_EXPANDED_CHUNKS: int = 10
    MAX_RESULTS_PER_DOCUMENT: int = 5

    # Layer 15 Security Settings
    AUTH_ENABLED: bool = True
    AUTH_SECRET_KEY: str = Field(..., description="JWT Secret Key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # OAuth 2.0 Providers (Google & GitHub)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply.liora@gmail.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply.liora@gmail.com"

    # Layer 1 Raw File Storage Configuration (Local Disk & Cloudflare R2 / S3)
    STORAGE_PROVIDER: str = "local"  # "local" or "s3"
    STORAGE_LOCAL_DIR: str = "storage/documents"
    S3_ENDPOINT_URL: str = ""        # e.g. "https://<account_id>.r2.cloudflarestorage.com"
    S3_BUCKET_NAME: str = "liora-documents"
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_REGION_NAME: str = "auto"     # "auto" for Cloudflare R2, "us-east-1" for AWS S3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
