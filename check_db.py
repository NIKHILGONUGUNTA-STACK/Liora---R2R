import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
from sqlalchemy import text
from app.db.database import SessionLocal

def check_db():
    print("Checking database...")
    try:
        db = SessionLocal()
        
        # Check docs
        result = db.execute(text("SELECT COUNT(*) FROM documents"))
        doc_count = result.scalar()
        
        # Check chunks
        result = db.execute(text("SELECT COUNT(*) FROM document_chunks"))
        chunk_count = result.scalar()
        
        # Check embeddings
        result = db.execute(text("SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL"))
        emb_count = result.scalar()
        
        print(f"Documents: {doc_count}")
        print(f"Chunks: {chunk_count}")
        print(f"Embeddings (not null): {emb_count}")
        
    except Exception as e:
        print(f"Error checking DB: {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    check_db()
