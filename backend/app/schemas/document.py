from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid
from app.db.models.document import DocumentStatus

class DocumentBase(BaseModel):
    filename: str
    owner_id: uuid.UUID
    title: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: str
    storage_path: Optional[str] = None
    doc_metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: uuid.UUID
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
    doc_metadata: Dict[str, Any] = Field(default_factory=dict)
    # We do not expose the embedding vector by default

class DocumentChunkCreate(DocumentChunkBase):
    id: Optional[uuid.UUID] = None
    document_id: uuid.UUID
    embedding: Optional[List[float]] = None

class DocumentChunkResponse(DocumentChunkBase):
    id: uuid.UUID
    document_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
