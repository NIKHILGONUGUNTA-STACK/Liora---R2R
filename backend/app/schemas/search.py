import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=50)

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Query cannot be empty or whitespace")
        return v.strip()

class SearchResult(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    content: str
    page_number: Optional[int]
    chunk_index: int
    source_type: Optional[str]
    source_name: Optional[str]
    filename: str
    distance: float
    similarity: float
    metadata: Dict[str, Any]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    result_count: int
    latency_ms: Optional[float] = None
    embedding_latency_ms: Optional[float] = None
    db_search_latency_ms: Optional[float] = None
