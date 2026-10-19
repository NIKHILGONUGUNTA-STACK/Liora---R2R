import uuid
from typing import List, Optional
from pydantic import BaseModel

class Citation(BaseModel):
    source_id: str
    document_id: uuid.UUID
    filename: str
    page_number: Optional[int] = None
    chunk_id: uuid.UUID
    chunk_index: int
    snippet: Optional[str] = None
    similarity_score: Optional[float] = None
    section: Optional[str] = None
    source_type: Optional[str] = None

class RawSourceItem(BaseModel):
    source_id: str
    document_id: uuid.UUID
    filename: str
    page_number: Optional[int] = None
    chunk_id: uuid.UUID
    chunk_index: int
    content: str
    similarity: float
    section: Optional[str] = None
    source_type: Optional[str] = None

class GenerationResult(BaseModel):
    answer: str
    citations: List[Citation]
    raw_sources: Optional[List[RawSourceItem]] = None
    model: str
    finish_reason: Optional[str] = None
    input_context_items: int
    generation_latency_ms: float
