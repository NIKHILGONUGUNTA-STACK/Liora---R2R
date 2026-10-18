from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db, SessionLocal
from app.db.repositories.document import DocumentRepository
from app.db.models.user import User
from app.api.deps import get_current_user
from app.schemas.document import DocumentResponse
from app.services.ingestion import DocumentIngestionService
from app.core.logging import logger, AuditLogger

router = APIRouter()

@router.post("", status_code=202, response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    process_sync: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = DocumentIngestionService(db)
    # Pass owner_id to the ingestion service
    doc_resp = await service.initiate_ingestion(file, owner_id=current_user.id)
    AuditLogger.log("DOCUMENT_UPLOAD", user_id=str(current_user.id), details={"document_id": str(doc_resp.id)})

    if process_sync:
        # Synchronously process small files so they are immediately queryable
        try:
            service.process_document(doc_resp.id)
        except Exception as e:
            logger.error(f"Synchronous ingestion failed for {doc_resp.id}: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    else:
        def run_process_document(document_id: UUID):
            worker_db = SessionLocal()
            try:
                worker_service = DocumentIngestionService(worker_db)
                worker_service.process_document(document_id)
            except Exception as e:
                logger.error(f"Background ingestion failed for {document_id}: {e}")
            finally:
                worker_db.close()

        background_tasks.add_task(run_process_document, doc_resp.id)

    return doc_resp

@router.get("/{document_id}/status")
def get_document_status(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.db.models.document import Document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.owner_id != current_user.id:
        if doc:
            AuditLogger.log("UNAUTHORIZED_RESOURCE_ACCESS", user_id=str(current_user.id), details={"document_id": str(document_id), "action": "status"})
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "status": doc.status.value if hasattr(doc.status, "value") else doc.status,
        "retry_count": doc.retry_count,
        "error_message": doc.error_message
    }

@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.db.models.document import Document
    docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
    return docs

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = DocumentRepository(db)
    doc = repo.get_document(document_id)
    if not doc or doc.owner_id != current_user.id:
        if doc:
            AuditLogger.log("UNAUTHORIZED_RESOURCE_ACCESS", user_id=str(current_user.id), details={"document_id": str(document_id), "action": "get"})
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{document_id}")
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = DocumentRepository(db)
    doc = repo.get_document(document_id)
    if not doc or doc.owner_id != current_user.id:
        if doc:
            AuditLogger.log("UNAUTHORIZED_RESOURCE_ACCESS", user_id=str(current_user.id), details={"document_id": str(document_id), "action": "delete"})
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Needs to delete storage file as well, but for DB logic:
    db.delete(doc)
    db.commit()
    AuditLogger.log("DOCUMENT_DELETE", user_id=str(current_user.id), details={"document_id": str(document_id)})
    return {"message": "Document deleted"}
