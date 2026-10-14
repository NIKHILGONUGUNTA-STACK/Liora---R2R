import pytest
import uuid
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.main import app, worker
from app.db.models.document import Document
from app.db.models.user import User
from app.services.auth import create_access_token

from app.db.database import get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    db = next(get_db())
    yield db
    db.close()

@pytest.fixture
def test_user_c(db_session: Session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"test_layer16_{user_id}@example.com",
        password_hash="fakehash",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user

def create_token(user_id: uuid.UUID):
    return create_access_token(data={"sub": str(user_id)})

def test_async_ingestion_e2e(test_user_c, db_session: Session):
    # This test verifies that the POST endpoint returns 202 quickly
    # and we can poll the status endpoint until completion.
    
    token = create_token(test_user_c.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    file_content = f"%PDF-1.4\n1 0 obj\n<< /Title (Test Async {uuid.uuid4()}) >>\nendobj\n".encode()
    files = {"file": ("test_async.pdf", file_content, "application/pdf")}
    
    import time
    start_time = time.time()
    res = client.post("/api/v1/documents", headers=headers, files=files)
    elapsed = time.time() - start_time
    
    assert res.status_code == 202
    assert elapsed < 1.0 # Should return quickly, no heavy processing
    
    doc = res.json()
    doc_id = doc["id"]
    # It might be in uploaded, processing, or already failed by the worker.
    assert doc["status"] in ["uploaded", "processing", "failed", "ready"]
    
    # Loop enough times to process previous tests' pending documents
    # and poll status endpoint until our document is done.
    status_data = {"status": doc["status"]}
    for _ in range(30):
        worker.process_next_job()
        res_status = client.get(f"/api/v1/documents/{doc_id}/status", headers=headers)
        if res_status.status_code == 404:
            print(f"404 NOT FOUND for doc_id {doc_id}")
            doc_in_db = db_session.query(Document).filter(Document.id == doc_id).first()
            if doc_in_db:
                print(f"Doc found in DB! owner={doc_in_db.owner_id}, expected={test_user_c.id}")
            else:
                print(f"Doc NOT found in DB!")
        assert res_status.status_code == 200
        status_data = res_status.json()
        if status_data["status"] in ["ready", "failed"]:
            break
        time.sleep(0.1)
    
    assert status_data["status"] in ["ready", "failed"]

def test_status_endpoint_security(test_user_c, db_session: Session):
    # Setup document for test_user_c
    doc = Document(
        id=uuid.uuid4(),
        owner_id=test_user_c.id,
        filename="test.pdf",
        file_hash=uuid.uuid4().hex,
        status="uploaded"
    )
    db_session.add(doc)
    db_session.commit()
    
    # Another user trying to access status
    other_user_id = uuid.uuid4()
    other_user = User(
        id=other_user_id,
        email=f"other_{other_user_id}@example.com",
        password_hash="hash",
        is_active=True
    )
    db_session.add(other_user)
    db_session.commit()
    
    other_token = create_token(other_user.id)
    res = client.get(f"/api/v1/documents/{doc.id}/status", headers={"Authorization": f"Bearer {other_token}"})
    assert res.status_code == 404
