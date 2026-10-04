from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from app.db.models.document import Document, DocumentChunk
from app.schemas.document import DocumentCreate, DocumentChunkCreate

class DocumentRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_document(self, doc_in: DocumentCreate) -> Document:
        db_doc = Document(
            filename=doc_in.filename,
            title=doc_in.title,
            mime_type=doc_in.mime_type,
            file_size=doc_in.file_size,
            file_hash=doc_in.file_hash,
            metadata_=doc_in.metadata_
        )
        self.session.add(db_doc)
        self.session.commit()
        self.session.refresh(db_doc)
        return db_doc

    def get_document(self, doc_id: UUID) -> Optional[Document]:
        return self.session.get(Document, doc_id)

    def delete_document(self, doc_id: UUID) -> bool:
        doc = self.get_document(doc_id)
        if doc:
            self.session.delete(doc)
            self.session.commit()
            return True
        return False

class DocumentChunkRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_chunk(self, chunk_in: DocumentChunkCreate) -> DocumentChunk:
        db_chunk = DocumentChunk(
            document_id=chunk_in.document_id,
            content=chunk_in.content,
            chunk_index=chunk_in.chunk_index,
            page_number=chunk_in.page_number,
            metadata_=chunk_in.metadata_,
            embedding=chunk_in.embedding
        )
        self.session.add(db_chunk)
        self.session.commit()
        self.session.refresh(db_chunk)
        return db_chunk

    def get_chunk(self, chunk_id: UUID) -> Optional[DocumentChunk]:
        return self.session.get(DocumentChunk, chunk_id)

    def get_chunks_by_document(self, document_id: UUID) -> List[DocumentChunk]:
        stmt = select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
        return list(self.session.scalars(stmt).all())

    def delete_chunk(self, chunk_id: UUID) -> bool:
        chunk = self.get_chunk(chunk_id)
        if chunk:
            self.session.delete(chunk)
            self.session.commit()
            return True
        return False
