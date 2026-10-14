import os
import sys
import asyncio
from io import BytesIO

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.db.database import SessionLocal
from app.services.ingestion import DocumentIngestionService

# Mock FastAPI UploadFile
class MockUploadFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.content_type = "application/pdf"
        self.size = len(content)
        self.file = BytesIO(content)
        
    async def seek(self, offset):
        self.file.seek(offset)
        
    async def read(self, size=-1):
        return self.file.read(size)

async def main():
    db = SessionLocal()
    
    # We must ensure DB has vector extension, but Alembic already handled it.
    service = DocumentIngestionService(db)
    
    with open("../liora_data/uploads/Aegis.pdf", "rb") as f:
        file_bytes = f.read()
        
    mock_file = MockUploadFile(filename="Aegis.pdf", content=file_bytes)
    
    print("Ingesting Aegis.pdf...")
    doc_resp, clean_doc = await service.ingest(mock_file)
    
    print(f"Ingested {doc_resp.filename} with {len(clean_doc.pages)} pages.")

if __name__ == "__main__":
    asyncio.run(main())
