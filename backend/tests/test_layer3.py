import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.database import SessionLocal
import io
import hashlib
from pypdf import PdfWriter

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.execute(text("DELETE FROM documents"))
    session.commit()
    session.close()

def create_test_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.add_blank_page(width=72, height=72)
    pdf_bytes = io.BytesIO()
    writer.write(pdf_bytes)
    return pdf_bytes.getvalue()

def test_api_upload_valid_pdf(db_session):
    pdf_bytes = create_test_pdf()
    
    files = {'file': ('test.pdf', pdf_bytes, 'application/pdf')}
    response = client.post("/api/v1/documents", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data['filename'] == 'test.pdf'
    assert data['status'] == 'ready'
    assert 'file_hash' in data
    assert data['doc_metadata']['page_count'] == 2

def test_api_upload_non_pdf():
    files = {'file': ('test.txt', b'This is not a pdf', 'text/plain')}
    response = client.post("/api/v1/documents", files=files)
    
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()['detail']

def test_api_upload_empty_pdf():
    files = {'file': ('empty.pdf', b'', 'application/pdf')}
    response = client.post("/api/v1/documents", files=files)
    
    assert response.status_code == 400
    assert "File is empty" in response.json()['detail']

def test_api_duplicate_upload():
    pdf_bytes = create_test_pdf()
    
    files1 = {'file': ('duplicate.pdf', pdf_bytes, 'application/pdf')}
    response1 = client.post("/api/v1/documents", files=files1)
    assert response1.status_code == 200
    id1 = response1.json()['id']
    
    files2 = {'file': ('duplicate_upload.pdf', pdf_bytes, 'application/pdf')}
    response2 = client.post("/api/v1/documents", files=files2)
    assert response2.status_code == 200
    id2 = response2.json()['id']
    
    # Should return the exact same document ID because of hash match
    assert id1 == id2

def test_api_get_documents():
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    assert len(response.json()) > 0
