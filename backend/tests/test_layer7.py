import pytest
from sqlalchemy import text
from app.db.database import SessionLocal
from app.db.models.document import DocumentChunk
from app.schemas.document import DocumentCreate, DocumentChunkCreate
from app.db.repositories.document import DocumentRepository, DocumentChunkRepository

@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.execute(text("DELETE FROM documents"))
    session.commit()
    session.close()

def test_1_pgvector_extension(db_session):
    result = db_session.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'")).fetchone()
    assert result is not None, "pgvector extension is not installed"

def test_2_vector_column(db_session):
    result = db_session.execute(text("""
        SELECT data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'document_chunks' AND column_name = 'embedding'
    """)).fetchone()
    assert result is not None, "embedding column not found"
    assert result[1] == 'vector', "embedding column is not a vector type"

def test_3_vector_dimension(db_session):
    # Test valid dimension
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    doc = repo.create_document(DocumentCreate(filename="dim_test.pdf", file_hash="hash_dim"))
    
    valid_vector = [0.1] * 1024
    chunk = DocumentChunkCreate(
        document_id=doc.id,
        content="Test chunk",
        chunk_index=0,
        embedding=valid_vector
    )
    
    db_chunk = chunk_repo.create_chunk(chunk)
    assert len(db_chunk.embedding) == 1024

def test_4_invalid_vector_dimension(db_session):
    # Test invalid dimension
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    doc = repo.create_document(DocumentCreate(filename="dim_fail.pdf", file_hash="hash_dim_fail"))
    
    invalid_vector = [0.1] * 1025
    chunk = DocumentChunkCreate(
        document_id=doc.id,
        content="Test chunk invalid dim",
        chunk_index=0,
        embedding=invalid_vector
    )
    
    from sqlalchemy.exc import DataError
    with pytest.raises(DataError):
        chunk_repo.create_chunk(chunk)
    
    db_session.rollback()

def test_5_vector_index_exists(db_session):
    result = db_session.execute(text("""
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'document_chunks' AND indexname = 'ix_document_chunks_embedding_hnsw'
    """)).fetchone()
    assert result is not None, "HNSW index does not exist"
    
def test_6_index_method(db_session):
    result = db_session.execute(text("""
        SELECT indexdef
        FROM pg_indexes 
        WHERE indexname = 'ix_document_chunks_embedding_hnsw'
    """)).fetchone()
    assert 'USING hnsw' in result[0], "Index is not using HNSW"

def test_7_operator_class(db_session):
    result = db_session.execute(text("""
        SELECT indexdef
        FROM pg_indexes 
        WHERE indexname = 'ix_document_chunks_embedding_hnsw'
    """)).fetchone()
    assert 'vector_cosine_ops' in result[0], "Index is not using vector_cosine_ops"

def test_8_null_embedding_behavior(db_session):
    # Chunks without embeddings should be stored fine
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    doc = repo.create_document(DocumentCreate(filename="null_emb.pdf", file_hash="hash_null"))
    
    chunk = DocumentChunkCreate(
        document_id=doc.id,
        content="Test chunk no emb",
        chunk_index=0,
        embedding=None
    )
    db_chunk = chunk_repo.create_chunk(chunk)
    assert db_chunk.embedding is None
