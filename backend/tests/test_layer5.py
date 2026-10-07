import pytest
import uuid
from app.services.text_cleaner import CleanDocument, CleanPage
from app.services.chunker import DocumentChunker
from app.db.repositories.document import DocumentRepository, DocumentChunkRepository
from app.schemas.document import DocumentCreate
from app.db.database import SessionLocal
from sqlalchemy import text

@pytest.fixture
def chunker():
    return DocumentChunker(chunk_size=800, chunk_overlap=120)

@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.execute(text("DELETE FROM documents"))
    session.commit()
    session.close()

def _create_doc(pages_text):
    pages = []
    for i, t in enumerate(pages_text):
        pages.append(CleanPage(page_number=i+1, clean_text=t, metadata={}))
    return CleanDocument(
        metadata={"document_id": str(uuid.uuid4()), "source_type": "pdf", "filename": "test.pdf"},
        pages=pages
    )

def test_1_small_page(chunker):
    # < 800 chars
    doc = _create_doc(["This is a small page."])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert chunks[0].content == "This is a small page."

def test_2_large_paragraph(chunker):
    # > 800 chars
    text = "A" * 900
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) > 1

def test_3_paragraph_preservation(chunker):
    p1 = "Paragraph 1 is here."
    p2 = "Paragraph 2 is here."
    text = f"{p1}\n\n{p2}"
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert p1 in chunks[0].content and p2 in chunks[0].content

def test_4_overlap():
    # 20 chars overlap
    c = DocumentChunker(chunk_size=50, chunk_overlap=20)
    text = "A" * 60 + "B" * 60
    doc = _create_doc([text])
    chunks = c.chunk(doc)
    assert len(chunks) > 1
    # Check that overlap actually happens
    # Chunk 1 ends with A. Chunk 2 should start with A from overlap and contain B.
    assert "A" in chunks[1].content and "B" in chunks[1].content

def test_5_page_preservation(chunker):
    doc = _create_doc(["Page 1 content", "Page 2 content"])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 2
    assert chunks[0].page_number == 1
    assert chunks[1].page_number == 2
    assert "Page 1" in chunks[0].content
    assert "Page 2" in chunks[1].content

def test_6_empty_page(chunker):
    doc = _create_doc(["", "Normal content", "  \n  "])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert chunks[0].page_number == 2

def test_7_heading_preservation(chunker):
    text = "# 3. Authentication\n\nAuthentication is responsible for validating access tokens."
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert "Authentication is responsible" in chunks[0].content

def test_8_list_preservation(chunker):
    text = "Here is a list:\n- Item A\n- Item B\n- Item C"
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert "- Item C" in chunks[0].content

def test_9_technical_text(chunker):
    text = "Contact admin@example.com for URL https://example.com/login (var x = 42;)"
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) == 1
    assert "admin@example.com" in chunks[0].content
    assert "https://example.com/login" in chunks[0].content
    assert "var x = 42;" in chunks[0].content

def test_10_determinism(chunker):
    doc = _create_doc(["A" * 900])
    doc.metadata["document_id"] = "12345678-1234-5678-1234-567812345678"
    
    chunks1 = chunker.chunk(doc)
    chunks2 = chunker.chunk(doc)
    
    assert len(chunks1) == len(chunks2)
    assert chunks1[0].id == chunks2[0].id
    assert chunks1[0].content == chunks2[0].content
    assert chunks1[0].chunk_index == chunks2[0].chunk_index

def test_11_configuration_validation():
    with pytest.raises(ValueError):
        DocumentChunker(chunk_size=100, chunk_overlap=150)

def test_12_oversized_block(chunker):
    text = "Word " * 200 # approx 1000 chars, single block without newlines
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    assert len(chunks) > 1
    assert "Word" in chunks[0].content and "Word" in chunks[1].content

def test_13_no_empty_chunks(chunker):
    text = " \n " * 900 # A lot of empty space that might get split
    doc = _create_doc([text])
    chunks = chunker.chunk(doc)
    # The chunker should just output 0 chunks if all text is space
    assert len(chunks) == 0

def test_14_database_persistence(db_session, chunker):
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    doc_in = DocumentCreate(
        filename="persistence.pdf",
        file_hash="chunkhash_db_test"
    )
    doc_db = repo.create_document(doc_in)
    
    doc = _create_doc(["Persistence test text"])
    doc.metadata["document_id"] = str(doc_db.id)
    chunks = chunker.chunk(doc)
    
    db_chunks = chunk_repo.create_chunks_batch(chunks)
    assert len(db_chunks) == 1
    assert db_chunks[0].document_id == doc_db.id
    assert db_chunks[0].content == "Persistence test text"
    
def test_15_transaction_safety(db_session, chunker):
    repo = DocumentRepository(db_session)
    chunk_repo = DocumentChunkRepository(db_session)
    
    doc_in = DocumentCreate(
        filename="tx_safety.pdf",
        file_hash="chunkhash_tx_safety"
    )
    doc_db = repo.create_document(doc_in)
    
    doc = _create_doc(["Good chunk", "Bad chunk"])
    doc.metadata["document_id"] = str(doc_db.id)
    chunks = chunker.chunk(doc)
    
    # Intentionally corrupt the second chunk to violate DB constraint
    # We will set a duplicate chunk index which should violate the unique constraint
    chunks[1].chunk_index = chunks[0].chunk_index
    
    with pytest.raises(Exception):
        chunk_repo.create_chunks_batch(chunks)
        
    db_session.rollback()
    
    # Verify no chunks were persisted
    persisted = chunk_repo.get_chunks_by_document(doc_db.id)
    assert len(persisted) == 0
