import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ContextItem(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    page_number: Optional[int]
    chunk_index: int
    content: str
    similarity: float
    distance: float
    source_type: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContextPackage(BaseModel):
    query: str
    items: List[ContextItem]
    total_items: int
    total_characters: int
    retrieval_metadata: Dict[str, Any] = Field(default_factory=dict)
