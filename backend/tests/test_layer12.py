import pytest
import uuid
from app.schemas.search import SearchResult, SearchRequest
from app.reranking.cross_encoder_reranker import CrossEncoderReranker
from app.retrieval.pipeline import RetrievalPipeline
from app.core.config import settings
from unittest.mock import MagicMock

# Mock model to avoid downloading/running real weights in unit tests
class MockCrossEncoder:
    def __init__(self, model_name):
        self.model_name = model_name
        
    def predict(self, pairs):
        # Return dummy scores, e.g., higher score for shorter chunks for testing sorting
        return [float(len(p[1])) for p in pairs]

@pytest.fixture
def mock_reranker(monkeypatch):
    monkeypatch.setattr("app.reranking.cross_encoder_reranker.CrossEncoder", MockCrossEncoder)
    return CrossEncoderReranker("test-model")

def make_result(content: str, chunk_id=None):
    return SearchResult(
        chunk_id=chunk_id or uuid.uuid4(),
        document_id=uuid.uuid4(),
        content=content,
        page_number=1,
        chunk_index=1,
        source_type="pdf",
        source_name="test",
        filename="test.pdf",
        distance=0.5,
        similarity=0.5,
        metadata={}
    )

def test_reranker_sorting(mock_reranker):
    candidates = [
        make_result("short"),        # score 5
        make_result("very long string"), # score 16
        make_result("medium len")    # score 10
    ]
    
    reranked = mock_reranker.rerank("query", candidates, top_k=5)
    
    assert len(reranked) == 3
    # Should be sorted descending by score (length)
    assert reranked[0].content == "very long string"
    assert reranked[1].content == "medium len"
    assert reranked[2].content == "short"
    
    # Metadata preserved
    assert reranked[0].rerank_score == 16.0
    assert reranked[0].similarity == 0.5

def test_reranker_top_k(mock_reranker):
    candidates = [make_result("a"), make_result("bb"), make_result("ccc"), make_result("dddd")]
    
    reranked = mock_reranker.rerank("query", candidates, top_k=2)
    assert len(reranked) == 2
    assert reranked[0].content == "dddd"
    assert reranked[1].content == "ccc"

def test_reranker_empty(mock_reranker):
    assert len(mock_reranker.rerank("query", [], top_k=5)) == 0

def test_pipeline_with_reranker(test_user):
    # Mock HybridRetriever
    mock_retriever = MagicMock()
    mock_retriever.final_top_k = 5
    mock_retriever.retrieve.return_value = MagicMock(
        results=[make_result("c"), make_result("bb"), make_result("aaa")],
        embedding_latency_ms=10.0,
        db_search_latency_ms=5.0
    )
    
    mock_reranker_instance = MagicMock()
    mock_reranker_instance.rerank.return_value = [make_result("aaa"), make_result("bb")]
    
    # Enable reranking
    settings.RERANKING_ENABLED = True
    settings.RERANKER_CANDIDATE_TOP_K = 20
    
    pipeline = RetrievalPipeline(mock_retriever, mock_reranker_instance)
    
    response = pipeline.retrieve(SearchRequest(query="test", top_k=5))
    
    # Check if retriever was manipulated to fetch candidate_top_k
    assert mock_retriever.final_top_k == 5 # Should be restored after
    
    # The pipeline should call rerank
    mock_reranker_instance.rerank.assert_called_once()
    assert len(response.results) == 2
    assert response.results[0].content == "aaa"

def test_pipeline_without_reranker(test_user):
    mock_retriever = MagicMock()
    mock_retriever.final_top_k = 5
    mock_retriever.retrieve.return_value = MagicMock(
        results=[make_result("c"), make_result("bb")],
        embedding_latency_ms=10.0,
        db_search_latency_ms=5.0
    )
    
    settings.RERANKING_ENABLED = False
    
    pipeline = RetrievalPipeline(mock_retriever, None)
    response = pipeline.retrieve(SearchRequest(query="test", top_k=5))
    
    assert len(response.results) == 2
