from pydantic import BaseModel, UUID4, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.db.models.document import DocumentStatus

class DocumentBase(BaseModel):
    filename: str
    title: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: str
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: UUID4
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class DocumentChunkBase(BaseModel):
    content: str
    chunk_index: int
    page_number: Optional[int] = None
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")
    # We do not expose the embedding vector by default

class DocumentChunkCreate(DocumentChunkBase):
    document_id: UUID4
    embedding: Optional[List[float]] = None

class DocumentChunkResponse(DocumentChunkBase):
    id: UUID4
    document_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
