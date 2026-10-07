import pytest
from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.db.models.document import Document, DocumentChunk
from app.schemas.document import DocumentCreate, DocumentChunkCreate
from app.db.repositories.document import DocumentRepository, DocumentChunkRepository
import uuid
from app.core.config import settings

@pytest.fixture(scope="module")
def db_session():
    # Setup test DB session
    session = SessionLocal()
    yield session
    # Teardown
    session.rollback()
    # Clean up test data
    session.execute(text("DELETE FROM documents"))
    session.commit()
    session.close()

def test_postgresql_connectivity(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_pgvector_extension(db_session):
    result = db_session.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'")).scalar()
    assert result == "vector"

def test_document_model_crud(db_session):
    repo = DocumentRepository(db_session)
    doc_in = DocumentCreate(
        filename="test_aegis.pdf",
        title="Aegis Document",
        file_hash="fakehash123",
        doc_metadata={"source": "upload"}
    )
    doc = repo.create_document(doc_in)
    
    assert doc.id is not None
    assert doc.filename == "test_aegis.pdf"
    assert doc.status == "uploaded"
    assert doc.doc_metadata["source"] == "upload"

    retrieved = repo.get_document(doc.id)
    assert retrieved is not None
    assert retrieved.filename == doc.filename

def test_document_chunk_model_crud(db_session):
    doc_repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)

    doc_in = DocumentCreate(
        filename="test_chunking.pdf",
        file_hash="fakehash456"
    )
    doc = doc_repo.create_document(doc_in)

    chunk_in = DocumentChunkCreate(
        document_id=doc.id,
        content="This is a test chunk.",
        chunk_index=0,
        doc_metadata={"page": 1}
    )
    chunk = chunk_repo.create_chunk(chunk_in)
    
    assert chunk.id is not None
    assert chunk.document_id == doc.id
    assert chunk.content == "This is a test chunk."
    assert chunk.doc_metadata["page"] == 1

def test_document_chunks_relationship_and_cascade(db_session):
    doc_repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)

    doc_in = DocumentCreate(
        filename="test_relationship.pdf",
        file_hash="fakehash789"
    )
    doc = doc_repo.create_document(doc_in)

    # Insert two chunks
    chunk_repo.create_chunk(DocumentChunkCreate(document_id=doc.id, content="Chunk 1", chunk_index=0))
    chunk_repo.create_chunk(DocumentChunkCreate(document_id=doc.id, content="Chunk 2", chunk_index=1))

    chunks = chunk_repo.get_chunks_by_document(doc.id)
    assert len(chunks) == 2

    # Cascade delete
    doc_repo.delete_document(doc.id)
    chunks_after = chunk_repo.get_chunks_by_document(doc.id)
    assert len(chunks_after) == 0

def test_unique_chunk_index_behavior(db_session):
    from sqlalchemy.exc import IntegrityError
    doc_repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)

    doc_in = DocumentCreate(
        filename="test_unique.pdf",
        file_hash="fakehash_unique"
    )
    doc = doc_repo.create_document(doc_in)

    chunk_repo.create_chunk(DocumentChunkCreate(document_id=doc.id, content="First", chunk_index=0))
    
    with pytest.raises(IntegrityError):
        chunk_repo.create_chunk(DocumentChunkCreate(document_id=doc.id, content="Duplicate Index", chunk_index=0))
    
    db_session.rollback()

def test_vector_storage_smoke_test(db_session):
    doc_repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)

    doc_in = DocumentCreate(
        filename="test_vector.pdf",
        file_hash="fakehash_vector"
    )
    doc = doc_repo.create_document(doc_in)

    dim = settings.EMBEDDING_DIMENSION
    # Create a tiny dummy vector of the correct dimension
    dummy_vector = [0.1] * dim

    chunk_in = DocumentChunkCreate(
        document_id=doc.id,
        content="Vector content",
        chunk_index=0,
        embedding=dummy_vector
    )
    chunk = chunk_repo.create_chunk(chunk_in)

    assert chunk.embedding is not None
    # Validate the stored vector by retrieving it
    retrieved = chunk_repo.get_chunk(chunk.id)
    import numpy as np
    assert np.allclose(retrieved.embedding, dummy_vector)
