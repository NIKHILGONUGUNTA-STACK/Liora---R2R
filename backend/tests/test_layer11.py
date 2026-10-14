import pytest
import uuid
from app.retrieval.rrf import apply_rrf
from app.schemas.search import SearchResult

def make_result(chunk_id, rank, source_type="pdf", similarity=0.0):
    return SearchResult(
        chunk_id=chunk_id,
        document_id=uuid.uuid4(),
        content="test content",
        page_number=1,
        chunk_index=rank,
        source_type=source_type,
        source_name="test",
        filename="test.pdf",
        distance=1.0 - similarity,
        similarity=similarity,
        metadata={}
    )

def test_rrf_pure(test_user):
    chunk1 = uuid.uuid4()
    chunk2 = uuid.uuid4()
    chunk3 = uuid.uuid4()
    
    dense_list = [
        make_result(chunk1, 1), # Rank 1 -> 1/61
        make_result(chunk2, 2)  # Rank 2 -> 1/62
    ]
    
    keyword_list = [
        make_result(chunk2, 1), # Rank 1 -> 1/61
        make_result(chunk3, 2)  # Rank 2 -> 1/62
    ]
    
    fused = apply_rrf([dense_list, keyword_list], k=60, limit=5)
    
    # chunk2 score: 1/62 + 1/61 = 0.016129 + 0.016393 = 0.03252
    # chunk1 score: 1/61 = 0.016393
    # chunk3 score: 1/62 = 0.016129
    
    assert len(fused) == 3
    assert fused[0].chunk_id == chunk2
    assert fused[1].chunk_id == chunk1
    assert fused[2].chunk_id == chunk3

def test_rrf_empty(test_user):
    fused = apply_rrf([[], []], k=60, limit=5)
    assert len(fused) == 0

def test_rrf_deterministic_ties(test_user):
    chunk1 = uuid.UUID('00000000-0000-0000-0000-000000000001')
    chunk2 = uuid.UUID('00000000-0000-0000-0000-000000000002')
    
    dense_list = [
        make_result(chunk2, 1), # 1/61
        make_result(chunk1, 2)  # 1/62
    ]
    
    keyword_list = [
        make_result(chunk1, 1), # 1/61
        make_result(chunk2, 2)  # 1/62
    ]
    
    # Both have score 1/61 + 1/62.
    # Tie break should sort by chunk_id ascending, so chunk1 first, chunk2 second.
    fused = apply_rrf([dense_list, keyword_list], k=60, limit=5)
    assert fused[0].chunk_id == chunk1
    assert fused[1].chunk_id == chunk2
