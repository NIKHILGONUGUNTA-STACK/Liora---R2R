import pytest
import uuid
from typing import List, Dict, Any, Optional

from app.schemas.search import SearchResponse, SearchResult
from app.rag.models import ContextPackage, ContextItem
from app.rag.context import ContextAssembler
from app.rag.serializer import ContextSerializer

def create_mock_result(
    content: str, 
    similarity: float, 
    distance: float, 
    chunk_index: int = 1,
    page_number: int = 1,
    doc_id: Optional[uuid.UUID] = None,
    chunk_id: Optional[uuid.UUID] = None
) -> SearchResult:
    return SearchResult(
        chunk_id=chunk_id or uuid.uuid4(),
        document_id=doc_id or uuid.uuid4(),
        content=content,
        page_number=page_number,
        chunk_index=chunk_index,
        source_type="pdf",
        source_name="Test Source",
        filename="test.pdf",
        distance=distance,
        similarity=similarity,
        metadata={"test_meta": True}
    )

def test_1_normal_context_assembly():
    assembler = ContextAssembler(max_chunks=5, max_chars=1000, min_relevance_score=0.1)
    results = [
        create_mock_result("Chunk 1", 0.8, 0.2),
        create_mock_result("Chunk 2", 0.6, 0.4)
    ]
    resp = SearchResponse(query="Test", results=results, result_count=2)
    package = assembler.assemble(resp)
    
    assert package.query == "Test"
    assert package.total_items == 2
    assert package.items[0].content == "Chunk 1"
    assert package.items[1].content == "Chunk 2"

def test_2_empty_retrieval():
    assembler = ContextAssembler()
    resp = SearchResponse(query="Test", results=[], result_count=0)
    package = assembler.assemble(resp)
    
    assert package.total_items == 0
    assert package.total_characters == 0
    
    serializer = ContextSerializer()
    serialized = serializer.serialize(package)
    assert serialized == "Insufficient evidence available."

def test_3_relevance_threshold():
    assembler = ContextAssembler(min_relevance_score=0.5)
    results = [
        create_mock_result("High relevance", 0.8, 0.2),
        create_mock_result("Low relevance", 0.4, 0.6)
    ]
    resp = SearchResponse(query="Test", results=results, result_count=2)
    package = assembler.assemble(resp)
    
    assert package.total_items == 1
    assert package.items[0].content == "High relevance"
    assert package.retrieval_metadata["filtered_count"] == 1

def test_4_max_context_chunks():
    assembler = ContextAssembler(max_chunks=2)
    results = [
        create_mock_result("C1", 0.9, 0.1),
        create_mock_result("C2", 0.8, 0.2),
        create_mock_result("C3", 0.7, 0.3)
    ]
    resp = SearchResponse(query="Test", results=results, result_count=3)
    package = assembler.assemble(resp)
    
    assert package.total_items == 2
    assert package.items[0].content == "C1"
    assert package.items[1].content == "C2"

def test_5_max_context_chars():
    assembler = ContextAssembler(max_chunks=5, max_chars=10)
    # C1 len: 6, C2 len: 6 (Total: 12 > 10)
    results = [
        create_mock_result("123456", 0.9, 0.1),
        create_mock_result("123456", 0.8, 0.2)
    ]
    resp = SearchResponse(query="Test", results=results, result_count=2)
    package = assembler.assemble(resp)
    
    assert package.total_items == 1
    assert package.total_characters == 6

def test_6_deterministic_ordering():
    assembler = ContextAssembler()
    doc_id = uuid.uuid4()
    
    results = [
        create_mock_result("Middle", 0.5, 0.5, chunk_index=2, doc_id=doc_id),
        create_mock_result("Best", 0.9, 0.1, chunk_index=1, doc_id=doc_id),
        create_mock_result("Worst", 0.1, 0.9, chunk_index=3, doc_id=doc_id),
        create_mock_result("Middle2", 0.5, 0.5, chunk_index=1, doc_id=doc_id) # Tie-breaker on index
    ]
    resp = SearchResponse(query="Test", results=results, result_count=4)
    package = assembler.assemble(resp)
    
    assert package.items[0].content == "Best"
    assert package.items[1].content == "Middle2"
    assert package.items[2].content == "Middle"
    assert package.items[3].content == "Worst"

def test_7_duplicate_removal():
    assembler = ContextAssembler()
    doc_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    
    results = [
        create_mock_result("C1", 0.9, 0.1, doc_id=doc_id, chunk_id=chunk_id),
        create_mock_result("C1 Duplicate", 0.8, 0.2, doc_id=doc_id, chunk_id=chunk_id)
    ]
    resp = SearchResponse(query="Test", results=results, result_count=2)
    package = assembler.assemble(resp)
    
    assert package.total_items == 1
    assert package.retrieval_metadata["duplicate_count"] == 1

def test_8_metadata_preservation():
    assembler = ContextAssembler()
    results = [create_mock_result("Data", 0.9, 0.1)]
    resp = SearchResponse(query="Test", results=results, result_count=1)
    package = assembler.assemble(resp)
    
    assert package.items[0].metadata["test_meta"] == True
    assert package.items[0].filename == "test.pdf"

def test_9_serialization():
    assembler = ContextAssembler()
    serializer = ContextSerializer()
    
    results = [create_mock_result("Serialized Content", 0.9, 0.1)]
    resp = SearchResponse(query="Test", results=results, result_count=1)
    package = assembler.assemble(resp)
    
    serialized = serializer.serialize(package)
    
    assert "[Source 1]" in serialized
    assert "Document: test.pdf" in serialized
    assert "Similarity: 0.9000" in serialized
    assert "Serialized Content" in serialized

def test_10_malformed_retrieval_result():
    assembler = ContextAssembler()
    # Missing chunk_id
    bad_res = create_mock_result("Bad", 0.9, 0.1)
    bad_res.chunk_id = None # type: ignore
    
    good_res = create_mock_result("Good", 0.8, 0.2)
    
    resp = SearchResponse(query="Test", results=[bad_res, good_res], result_count=2)
    package = assembler.assemble(resp)
    
    assert package.total_items == 1
    assert package.items[0].content == "Good"
