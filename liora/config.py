"""
Liora Configuration Module
Handles all configuration for the standalone Liora pipeline.
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

@dataclass
class LioraConfig:
    """Central configuration for the Liora pipeline."""

    # --- Paths ---
    data_dir: Path = field(default_factory=lambda: Path("liora_data"))
    db_path: Optional[Path] = None  # defaults to data_dir / "chroma_db"
    upload_dir: Optional[Path] = None  # defaults to data_dir / "uploads"

    # --- Chunking ---
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # --- Embedding ---
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # --- Retrieval ---
    top_k: int = 5
    similarity_threshold: float = 0.3

    # --- LLM (Google Gemini) ---
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"
    max_tokens: int = 4096
    temperature: float = 0.2

    # --- Server ---
    host: str = "127.0.0.1"
    port: int = 7272

    def __post_init__(self):
        # Resolve paths
        self.data_dir = Path(self.data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        if self.db_path is None:
            self.db_path = self.data_dir / "chroma_db"
        if self.upload_dir is None:
            self.upload_dir = self.data_dir / "uploads"

        self.upload_dir.mkdir(parents=True, exist_ok=True)

        # Load API key from environment if not set
        if self.gemini_api_key is None:
            self.gemini_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    @classmethod
    def from_env(cls) -> "LioraConfig":
        """Create config from environment variables."""
        return cls(
            data_dir=Path(os.getenv("LIORA_DATA_DIR", "liora_data")),
            chunk_size=int(os.getenv("LIORA_CHUNK_SIZE", "1000")),
            chunk_overlap=int(os.getenv("LIORA_CHUNK_OVERLAP", "200")),
            embedding_model=os.getenv("LIORA_EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
            top_k=int(os.getenv("LIORA_TOP_K", "5")),
            gemini_api_key=os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"),
            gemini_model=os.getenv("LIORA_GEMINI_MODEL", "gemini-2.0-flash"),
            temperature=float(os.getenv("LIORA_TEMPERATURE", "0.2")),
            host=os.getenv("LIORA_HOST", "127.0.0.1"),
            port=int(os.getenv("LIORA_PORT", "7272")),
        )
