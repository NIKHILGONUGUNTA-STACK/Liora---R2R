import os
import shutil
import hashlib
from pathlib import Path
from fastapi import UploadFile

class FileStorage:
    def __init__(self, base_dir: str = "storage/documents"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, file_hash: str, owner_id: str, document_id: str) -> str:
        # Create a safe, unique filename based on the hash to avoid conflicts
        # Prevent path traversal in extension
        ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        ext = "".join(c for c in ext if c.isalnum() or c == ".")
        safe_filename = f"{file_hash}{ext}"
        
        # Store in user/document specific directory
        doc_dir = self.base_dir / str(owner_id) / str(document_id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        file_path = doc_dir / safe_filename
        
        # Seek to start since it might have been read for hashing
        await file.seek(0)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return str(file_path.absolute())

    def open(self, storage_path: str):
        return open(storage_path, "rb")

    def delete(self, storage_path: str) -> bool:
        path = Path(storage_path)
        if path.exists() and path.is_file():
            path.unlink()
            # Try to remove the parent directory if empty
            try:
                path.parent.rmdir()
            except OSError:
                pass
            return True
        return False

    def exists(self, storage_path: str) -> bool:
        return Path(storage_path).exists()
