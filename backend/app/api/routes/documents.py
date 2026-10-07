from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.repositories.document import DocumentRepository
from app.schemas.document import DocumentResponse
from app.services.ingestion import DocumentIngestionService
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    service = DocumentIngestionService(db)
    # The ingestion service returns (DocumentResponse, ParsedDocument)
    # But for the API, we only return the DocumentResponse
    doc_resp, _ = await service.ingest(file)
    return doc_resp

@router.get("", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    repo = DocumentRepository(db)
    # For now, just return all documents (no pagination yet)
    # We should add a basic query, but since the repo doesn't have list_all yet, let's implement it or just use db.query directly
    from app.db.models.document import Document
    docs = db.query(Document).all()
    return docs

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    repo = DocumentRepository(db)
    doc = repo.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
