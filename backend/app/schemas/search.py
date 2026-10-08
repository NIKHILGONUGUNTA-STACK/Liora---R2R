import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class RetrievalFilter(BaseModel):
    document_id: Optional[uuid.UUID] = None
    filename: Optional[str] = None
    source_type: Optional[str] = None
    page_number: Optional[int] = None

class SearchRequest(BaseModel):
    query: str
    original_query: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=50)
    filter: Optional[RetrievalFilter] = None

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
    rrf_score: Optional[float] = None
    rerank_score: Optional[float] = None
    metadata: Dict[str, Any]
    retrieved: bool = True
    context_expanded: bool = False
    expansion_distance: int = 0

class SearchResponse(BaseModel):
    query: str
    original_query: Optional[str] = None
    results: List[SearchResult]
    result_count: int
    latency_ms: Optional[float] = None
    embedding_latency_ms: Optional[float] = None
    db_search_latency_ms: Optional[float] = None
