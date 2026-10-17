import hashlib
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.db.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.storage import FileStorage
from app.services.pdf_parser import PDFParserService, ParsedDocument
from app.core.logging import logger
from typing import Tuple
import uuid

class DocumentIngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DocumentRepository(db)
        self.storage = FileStorage()
        self.parser = PDFParserService()
        self.MAX_FILE_SIZE_MB = 50

    async def _calculate_hash(self, file: UploadFile) -> str:
        sha256 = hashlib.sha256()
        await file.seek(0)
        while chunk := await file.read(8192):
            sha256.update(chunk)
        await file.seek(0)
        return sha256.hexdigest()

    async def _validate_file(self, file: UploadFile):
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
        if file.content_type and file.content_type != 'application/pdf':
            raise HTTPException(status_code=400, detail="Invalid content type. Expected application/pdf.")
            
        if hasattr(file, "size") and file.size is not None:
            size = file.size
        else:
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
        
        if size == 0:
            raise HTTPException(status_code=400, detail="File is empty.")
            
        if size > self.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {self.MAX_FILE_SIZE_MB}MB.")
            
        return size

    async def initiate_ingestion(self, file: UploadFile, owner_id: uuid.UUID) -> DocumentResponse:
        logger.info(f"Initiating ingestion for {file.filename}")
        
        # 1. Validation
        file_size = await self._validate_file(file)
        
        # 2. Hashing & Duplicate detection
        file_hash = await self._calculate_hash(file)
        existing_doc = self.repo.get_document_by_hash(file_hash, owner_id)
        if existing_doc:
            logger.info(f"Document {file.filename} already exists (hash matched).")
            return DocumentResponse.model_validate(existing_doc)
            
        # 3. Storage
        document_id = uuid.uuid4()
        storage_path = await self.storage.save(file, file_hash, str(owner_id), str(document_id))
        
        # 4. Document Creation
        doc_in = DocumentCreate(
            filename=file.filename,
            owner_id=owner_id,
            mime_type="application/pdf",
            file_size=file_size,
            file_hash=file_hash,
            storage_path=storage_path,
            doc_metadata={"source": "api_upload"}
        )
        doc = self.repo.create_document(doc_in, document_id)
        
        return DocumentResponse.model_validate(doc)

    def process_document(self, document_id: uuid.UUID):
        # NOTE: This runs in background worker, expects a valid db session in self.repo
        doc = self.repo.get_document(document_id)
        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        storage_path = doc.storage_path
        file_filename = doc.filename
        
        try:
            # 6. Parse PDF (supports both local disk path and Cloudflare R2 / S3 stream)
            if storage_path.startswith("s3://"):
                file_stream = self.storage.open(storage_path)
                parsed_doc = self.parser.parse(file_stream)
            else:
                parsed_doc = self.parser.parse(storage_path)
            
            # 7. Clean Text and Normalize Metadata
            from app.services.text_cleaner import DocumentTextCleaner
            cleaner = DocumentTextCleaner()
            clean_doc = cleaner.clean(parsed_doc, str(doc.id), file_filename)
            
            # Merge PDF metadata into Document metadata
            new_metadata = dict(doc.doc_metadata)
            new_metadata.update(clean_doc.metadata)
            doc.doc_metadata = new_metadata
            self.repo.session.commit()
            
            # 8. Chunking
            from app.services.chunker import DocumentChunker
            chunker = DocumentChunker()
            chunks = chunker.chunk(clean_doc)
            
            # 9. Embedding
            if chunks:
                from app.embeddings.provider import get_embedding_provider
                embedder = get_embedding_provider()
                
                texts_to_embed = [chunk.content for chunk in chunks]
                embeddings = embedder.embed_texts(texts_to_embed)
                
                for chunk, emb in zip(chunks, embeddings):
                    chunk.embedding = emb
                    chunk.doc_metadata["embedding_model"] = embedder.model_name
            
            # 10. Persistence
            from app.db.repositories.document import DocumentChunkRepository
            chunk_repo = DocumentChunkRepository(self.repo.session)
            chunk_repo.create_chunks_batch(chunks)
            
            # 11. Update status to ready
            self.repo.update_document_status(doc.id, "ready")
            logger.info(f"Ingestion complete for {file_filename}")
            
        except Exception as e:
            logger.error(f"Ingestion failed for {file_filename}: {e}")
            doc.status = "failed"
            doc.error_message = str(e)
            self.repo.session.commit()
