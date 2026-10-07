import uuid
from typing import List, Optional
from pydantic import BaseModel

class Citation(BaseModel):
    source_id: str
    document_id: uuid.UUID
    filename: str
    page_number: Optional[int]
    chunk_id: uuid.UUID
    chunk_index: int

class GenerationResult(BaseModel):
    answer: str
    citations: List[Citation]
    model: str
    finish_reason: Optional[str] = None
    input_context_items: int
    generation_latency_ms: float
