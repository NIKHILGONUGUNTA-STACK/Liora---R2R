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
            storage_path=doc_in.storage_path,
            doc_metadata=doc_in.doc_metadata
        )
        self.session.add(db_doc)
        self.session.commit()
        self.session.refresh(db_doc)
        return db_doc

    def get_document(self, doc_id: UUID) -> Optional[Document]:
        return self.session.get(Document, doc_id)

    def get_document_by_hash(self, file_hash: str) -> Optional[Document]:
        stmt = select(Document).where(Document.file_hash == file_hash)
        return self.session.scalar(stmt)
        
    def update_document_status(self, doc_id: UUID, status: str) -> Optional[Document]:
        doc = self.get_document(doc_id)
        if doc:
            doc.status = status
            self.session.commit()
            self.session.refresh(doc)
        return doc

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
        kwargs = {
            "document_id": chunk_in.document_id,
            "content": chunk_in.content,
            "chunk_index": chunk_in.chunk_index,
            "page_number": chunk_in.page_number,
            "doc_metadata": chunk_in.doc_metadata,
            "embedding": chunk_in.embedding
        }
        if chunk_in.id is not None:
            kwargs["id"] = chunk_in.id
            
        db_chunk = DocumentChunk(**kwargs)
        self.session.add(db_chunk)
        self.session.commit()
        self.session.refresh(db_chunk)
        return db_chunk

    def create_chunks_batch(self, chunks_in: List[DocumentChunkCreate]) -> List[DocumentChunk]:
        db_chunks = []
        for chunk_in in chunks_in:
            kwargs = {
                "document_id": chunk_in.document_id,
                "content": chunk_in.content,
                "chunk_index": chunk_in.chunk_index,
                "page_number": chunk_in.page_number,
                "doc_metadata": chunk_in.doc_metadata,
                "embedding": chunk_in.embedding
            }
            if chunk_in.id is not None:
                kwargs["id"] = chunk_in.id
            db_chunks.append(DocumentChunk(**kwargs))
            
        self.session.add_all(db_chunks)
        self.session.commit()
        for chunk in db_chunks:
            self.session.refresh(chunk)
        return db_chunks

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
