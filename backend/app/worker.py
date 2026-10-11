import asyncio
from datetime import datetime, timedelta
from sqlalchemy import text
from app.db.database import SessionLocal
from app.db.models.document import Document
from app.services.ingestion import DocumentIngestionService
from app.core.logging import logger

class IngestionWorker:
    def __init__(self, max_retries: int = 3, timeout_minutes: int = 15):
        self.max_retries = max_retries
        self.timeout_minutes = timeout_minutes
        self._running = False

    async def run(self):
        self._running = True
        logger.info("Ingestion worker started.")
        while self._running:
            try:
                await asyncio.sleep(1) # Basic poll delay
                self.process_next_job()
                self.recover_stalled_jobs()
            except asyncio.CancelledError:
                self._running = False
                logger.info("Ingestion worker cancelled.")
            except Exception as e:
                logger.error(f"Error in ingestion worker loop: {e}")
                await asyncio.sleep(5) # Backoff on fatal loop error
                
    def stop(self):
        self._running = False

    def process_next_job(self):
        with SessionLocal() as session:
            # PostgreSQL specific lock
            # We select one document that is 'uploaded'
            stmt = text("""
                SELECT id FROM documents 
                WHERE status = 'uploaded' 
                FOR UPDATE SKIP LOCKED 
                LIMIT 1
            """)
            result = session.execute(stmt).first()
            
            if not result:
                return # No jobs
                
            document_id = result.id
            
            doc = session.query(Document).filter(Document.id == document_id).first()
            if not doc:
                return
                
            # Set to processing
            doc.status = "processing"
            doc.processing_started_at = datetime.utcnow()
            session.commit()
            
            logger.info(f"Worker picked up document {document_id}")
            
            service = DocumentIngestionService(session)
            try:
                service.process_document(doc.id)
                # Note: process_document handles its own commits for ready/failed
            except Exception as e:
                logger.error(f"Worker process_document unhandled exception for {document_id}: {e}")
                
                # Rollback just in case service left transaction open
                session.rollback() 
                
                # Re-fetch to update retry count
                doc = session.query(Document).filter(Document.id == document_id).first()
                if doc:
                    doc.retry_count += 1
                    if doc.retry_count >= self.max_retries:
                        doc.status = "failed"
                        doc.error_message = f"Max retries exceeded. Last error: {e}"
                    else:
                        doc.status = "uploaded" # Back in queue
                    session.commit()

    def recover_stalled_jobs(self):
        with SessionLocal() as session:
            timeout_threshold = datetime.utcnow() - timedelta(minutes=self.timeout_minutes)
            
            stalled_docs = session.query(Document).filter(
                Document.status == "processing",
                Document.processing_started_at <= timeout_threshold
            ).all()
            
            for doc in stalled_docs:
                logger.warning(f"Recovering stalled document {doc.id} (started at {doc.processing_started_at})")
                doc.retry_count += 1
                if doc.retry_count >= self.max_retries:
                    doc.status = "failed"
                    doc.error_message = "Max retries exceeded due to repeated stalling/timeouts."
                else:
                    doc.status = "uploaded"
                    doc.processing_started_at = None
            
            if stalled_docs:
                session.commit()
