import pytest
from uuid import uuid4
from sqlalchemy import text
from app.db.database import SessionLocal
from app.db.models.document import DocumentChunk, Document
from app.schemas.document import DocumentCreate, DocumentChunkCreate
from app.db.repositories.document import DocumentRepository, DocumentChunkRepository
from app.schemas.search import SearchRequest
from app.retrieval.retriever import VectorRetriever
from tests.test_layer6 import FakeEmbeddingProvider
from pydantic import ValidationError

@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.execute(text("DELETE FROM documents"))
    session.commit()
    session.close()

@pytest.fixture(scope="module")
def seed_data(db_session):
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    # Create test document
    doc = repo.create_document(DocumentCreate(filename="Aegis.pdf", file_hash="hash_aegis"))
    
    chunks = [
        DocumentChunkCreate(
            document_id=doc.id,
            content="Aegis is a SaaS API monitoring platform designed to detect data leakage and access anomalies.",
            chunk_index=0,
            page_number=1,
            embedding=[1.0, 0.0] + [0.0] * 1022,  # specific direction
            doc_metadata={"source_type": "pdf"}
        ),
        DocumentChunkCreate(
            document_id=doc.id,
            content="Unrelated chunk about billing and invoices.",
            chunk_index=1,
            page_number=2,
            embedding=[0.0, 1.0] + [0.0] * 1022,  # orthogonal direction
            doc_metadata={"source_type": "pdf"}
        )
    ]
    chunk_repo.create_chunks_batch(chunks)
    
    return doc

@pytest.fixture
def retriever(db_session):
    provider = FakeEmbeddingProvider(dimension=1024, model_name="fake-model")
    return VectorRetriever(session=db_session, provider=provider)

def test_1_valid_query(retriever, seed_data):
    # FakeEmbeddingProvider returns [len(text)] * 1024 by default.
    # We want it to match chunk 1. Let's monkeypatch embed_text just for this test
    # so it returns [1.0, 0.0, ...]
    original_embed_text = retriever.provider.embed_text
    retriever.provider.embed_text = lambda x: [1.0, 0.0] + [0.0] * 1022
    
    try:
        req = SearchRequest(query="What does Aegis monitor?", top_k=5)
        resp = retriever.retrieve(req)
        
        assert resp.result_count == 2
        assert resp.results[0].filename == "Aegis.pdf"
        assert "Aegis is a SaaS" in resp.results[0].content
    finally:
        retriever.provider.embed_text = original_embed_text

def test_2_empty_query():
    with pytest.raises(ValidationError):
        SearchRequest(query="")

def test_3_whitespace_query():
    with pytest.raises(ValidationError):
        SearchRequest(query="   ")

def test_4_invalid_top_k():
    with pytest.raises(ValidationError):
        SearchRequest(query="test", top_k=0)
    with pytest.raises(ValidationError):
        SearchRequest(query="test", top_k=100)

def test_5_correct_ordering(retriever, seed_data):
    req = SearchRequest(query="Test")
    resp = retriever.retrieve(req)
    
    # Distance should be ordered ascending
    assert resp.results[0].distance <= resp.results[1].distance
    # Similarity should be 1 - distance
    assert abs(resp.results[0].similarity - (1.0 - resp.results[0].distance)) < 1e-5

def test_6_null_embeddings_excluded(db_session, retriever, seed_data):
    chunk_repo = DocumentChunkRepository(db_session)
    chunk = DocumentChunkCreate(
        document_id=seed_data.id,
        content="Null embedding chunk",
        chunk_index=2,
        embedding=None
    )
    chunk_repo.create_chunk(chunk)
    
    req = SearchRequest(query="Test", top_k=10)
    resp = retriever.retrieve(req)
    assert resp.result_count == 2  # Not 3
    for r in resp.results:
        assert "Null embedding chunk" not in r.content

def test_7_golden_retrieval(retriever, seed_data):
    original_embed_text = retriever.provider.embed_text
    retriever.provider.embed_text = lambda x: [1.0, 0.0] + [0.0] * 1022
    
    try:
        req = SearchRequest(query="What does Aegis monitor?", top_k=1)
        resp = retriever.retrieve(req)
        assert resp.result_count == 1
        assert "Aegis is a SaaS" in resp.results[0].content
    finally:
        retriever.provider.embed_text = original_embed_text

def test_8_latency_measured(retriever, seed_data):
    req = SearchRequest(query="latency test")
    resp = retriever.retrieve(req)
    assert resp.latency_ms > 0
    assert resp.embedding_latency_ms >= 0
    assert resp.db_search_latency_ms >= 0
    assert resp.latency_ms >= resp.embedding_latency_ms + resp.db_search_latency_ms

def test_9_dimension_validation(db_session):
    provider = FakeEmbeddingProvider(dimension=1024)
    # Monkeypatch to return bad dimension
    provider.embed_text = lambda x: [1.0] * 1025
    retriever = VectorRetriever(session=db_session, provider=provider)
    req = SearchRequest(query="dimension mismatch")
    with pytest.raises(ValueError, match="Query vector dimension mismatch"):
        retriever.retrieve(req)
