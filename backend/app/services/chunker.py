import uuid
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings
from app.services.text_cleaner import CleanDocument, CleanPage
from app.schemas.document import DocumentChunkCreate
from app.core.logging import logger

class DocumentChunker:
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError(f"CHUNK_OVERLAP ({self.chunk_overlap}) must be less than CHUNK_SIZE ({self.chunk_size})")

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def _generate_chunk_id(self, document_id: str, page_number: int, chunk_index: int) -> uuid.UUID:
        """Generates a stable deterministic UUID for a chunk."""
        # Using a fixed namespace for Liora chunks
        namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8') # standard namespace (DNS)
        name = f"{document_id}_{page_number}_{chunk_index}"
        return uuid.uuid5(namespace, name)

    def chunk(self, document: CleanDocument) -> List[DocumentChunkCreate]:
        doc_meta = document.metadata
        document_id = doc_meta["document_id"]
        
        logger.info(f"Starting chunking for document {document_id}")
        
        chunks = []
        global_chunk_index = 0
        
        for page in document.pages:
            if not page.clean_text or not page.clean_text.strip():
                continue
                
            # Splitting by page preserves page boundary guarantees
            page_chunks = self.text_splitter.split_text(page.clean_text)
            
            for page_chunk_index, chunk_text in enumerate(page_chunks):
                if not chunk_text.strip():
                    continue
                    
                chunk_id = self._generate_chunk_id(document_id, page.page_number, global_chunk_index)
                
                # Metadata propagation
                chunk_metadata = {
                    "source_type": doc_meta.get("source_type"),
                    "source_name": doc_meta.get("source_name"),
                    "filename": doc_meta.get("filename"),
                    "page_chunk_index": page_chunk_index,
                    "character_count": len(chunk_text),
                    "word_count": len(chunk_text.split())
                }
                
                chunk_create = DocumentChunkCreate(
                    id=chunk_id,
                    document_id=uuid.UUID(document_id),
                    content=chunk_text,
                    chunk_index=global_chunk_index,
                    page_number=page.page_number,
                    doc_metadata=chunk_metadata
                )
                
                chunks.append(chunk_create)
                global_chunk_index += 1
                
        logger.info(f"Finished chunking document {document_id}. Created {len(chunks)} chunks.")
        return chunks
