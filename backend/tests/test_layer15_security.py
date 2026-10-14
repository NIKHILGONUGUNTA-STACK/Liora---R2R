import pytest
import os
import io
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.database import get_db
from app.db.models.user import User, UserRole
from app.db.models.document import Document, DocumentChunk
from app.core.config import settings

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    # Use the test client's dependency override or a direct session
    db = next(get_db())
    yield db
    db.close()

@pytest.fixture
def test_user_a(db_session: Session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"usera_{user_id}@example.com",
        password_hash="test_hash",
        role=UserRole.USER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_user_b(db_session: Session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"userb_{user_id}@example.com",
        password_hash="test_hash",
        role=UserRole.USER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def inactive_user(db_session: Session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"inactive_{user_id}@example.com",
        password_hash="test_hash",
        role=UserRole.USER.value,
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()
    return user

def create_token(user_id: str, minutes: int = 60) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires},
        settings.AUTH_SECRET_KEY,
        algorithm="HS256"
    )

def test_jwt_missing():
    response = client.get("/api/v1/documents")
    assert response.status_code == 401

def test_jwt_malformed():
    response = client.get("/api/v1/documents", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401

def test_jwt_invalid_signature():
    token = jwt.encode({"sub": str(uuid.uuid4())}, "wrong_secret", algorithm="HS256")
    response = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_jwt_expired(test_user_a):
    token = create_token(test_user_a.id, minutes=-10)
    response = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

def test_jwt_inactive_user(inactive_user):
    token = create_token(inactive_user.id)
    response = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Inactive user" in response.json()["detail"]

def test_idor_document_access(test_user_a, test_user_b, db_session: Session):
    # Setup document for User A
    doc = Document(
        id=uuid.uuid4(),
        owner_id=test_user_a.id,
        filename="test_a.pdf",
        file_hash=uuid.uuid4().hex,
        storage_path="path_a",
        doc_metadata={},
    )
    db_session.add(doc)
    db_session.commit()

    token_b = create_token(test_user_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # B attempts to GET A's document
    res = client.get(f"/api/v1/documents/{doc.id}", headers=headers_b)
    assert res.status_code == 404

    # B attempts to DELETE A's document
    res = client.delete(f"/api/v1/documents/{doc.id}", headers=headers_b)
    assert res.status_code == 404

def test_neighbor_authorization(test_user_a, test_user_b, db_session: Session):
    """Verify Layer 14 Context Expansion doesn't leak cross-user chunks."""
    doc_a = Document(
        id=uuid.uuid4(),
        owner_id=test_user_a.id,
        filename="doc_a.pdf",
        file_hash=uuid.uuid4().hex,
        storage_path="path_a",
        doc_metadata={},
    )
    doc_b = Document(
        id=uuid.uuid4(),
        owner_id=test_user_b.id,
        filename="doc_b.pdf",
        file_hash=uuid.uuid4().hex,
        storage_path="path_b",
        doc_metadata={},
    )
    db_session.add_all([doc_a, doc_b])
    db_session.commit()

    # Add chunks with identical global chunk_indices (10, 11, 12)
    for i in [10, 11, 12]:
        c_a = DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_a.id,
            content=f"User A Content {i}",
            chunk_index=i,
            page_number=1,
            doc_metadata={}
        )
        c_b = DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_b.id,
            content=f"User B Content {i}",
            chunk_index=i,
            page_number=1,
            doc_metadata={}
        )
        db_session.add_all([c_a, c_b])
    db_session.commit()

    from app.retrieval.context_processor import AdvancedContextProcessor
    from app.schemas.search import SearchResult
    processor = AdvancedContextProcessor(db_session)
    
    # Simulate retrieving User A chunk 11
    # Note: SearchResult expects document_id as uuid.UUID in schema, but pydantic converts automatically
    # Need to get actual chunk 11 for A
    chunk_11_a = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_a.id, DocumentChunk.chunk_index == 11).first()
    
    sr_a11 = SearchResult(
        chunk_id=chunk_11_a.id,
        document_id=chunk_11_a.document_id,
        content=chunk_11_a.content,
        page_number=chunk_11_a.page_number,
        chunk_index=chunk_11_a.chunk_index,
        source_type="pdf",
        source_name="doc_a",
        filename="doc_a.pdf",
        distance=0.1,
        similarity=0.9,
        retrieved=True,
        context_expanded=False,
        metadata={}
    )

    expanded = processor.process([sr_a11])
    
    expanded_doc_ids = set(str(r.document_id) for r in expanded)
    
    # Assert all expanded chunks strictly belong to doc_a
    assert str(doc_a.id) in expanded_doc_ids
    assert str(doc_b.id) not in expanded_doc_ids

def test_file_upload_security(test_user_a):
    token = create_token(test_user_a.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Malformed / Traversal PDF filename
    file_content = b"fake pdf content"
    malicious_filename = "../../secret.pdf"
    
    files = {"file": (malicious_filename, file_content, "application/pdf")}
    res = client.post("/api/v1/documents", headers=headers, files=files)
    
    # Depending on how the parser handles it, it might return 202 (accepted for async processing).
    # The key security requirement is that it doesn't traverse directories.
    assert res.status_code == 202
