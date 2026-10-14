import pytest
import time
import uuid
from unittest.mock import MagicMock, patch
from google.genai.errors import APIError

from app.query.analyzer import QueryAnalyzer
from app.query.rewriter import GeminiQueryRewriter
from app.schemas.query import QueryAnalysis
from app.api.routes.chat import chat
from app.schemas.chat import ChatRequest
from app.schemas.search import SearchResponse, SearchResult
from app.schemas.generation import GenerationResult

@pytest.fixture
def mock_genai_client():
    with patch("app.query.rewriter.genai.Client") as mock:
        yield mock

def test_whitespace_normalization(test_user):
    # 1. Whitespace normalization
    query = "  What   is   Aegis??  "
    normalized = QueryAnalyzer.normalize(query)
    assert normalized == "What is Aegis?"

def test_empty_query_handling(test_user):
    # 2. Empty query handling
    assert QueryAnalyzer.normalize("") == ""
    assert QueryAnalyzer.normalize("   ") == ""

def test_short_query_no_rewrite(test_user):
    # 3. Short query handling
    # 4. Simple factual query does not require rewrite
    rewriter = GeminiQueryRewriter()
    # Need to force enable for testing
    rewriter.enabled = True
    rewriter.client = MagicMock()
    
    analysis = rewriter.analyze_and_rewrite("What is Aegis?")
    assert analysis.requires_rewrite is False
    assert analysis.original_query == "What is Aegis?"
    assert analysis.normalized_query == "What is Aegis?"
    assert analysis.rewritten_query == "What is Aegis?"
    assert analysis.query_type == "factual"
    # Should not have called Gemini because of the fast path
    rewriter.client.models.generate_content.assert_not_called()

def test_complex_query_rewrite(test_user):
    # 5. Complex query can require rewrite
    # 6. Technical terms preserved
    # 9. Original query preserved
    # 10. Rewritten query differs
    # 11. Rewrite provider success
    rewriter = GeminiQueryRewriter()
    rewriter.enabled = True
    rewriter.client = MagicMock()
    
    mock_response = MagicMock()
    mock_response.text = '{"query_type": "technical", "requires_rewrite": true, "rewritten_query": "How does Aegis detect API access anomalies using JWT?", "rewrite_reason": "Contextualize"}'
    rewriter.client.models.generate_content.return_value = mock_response
    
    query = "How does it detect API access anomalies using JWT?"
    analysis = rewriter.analyze_and_rewrite(query)
    
    assert analysis.requires_rewrite is True
    assert analysis.original_query == query
    assert "Aegis" in analysis.rewritten_query
    assert "JWT" in analysis.rewritten_query
    assert analysis.query_type == "technical"
    assert analysis.fallback_used is False

def test_rewrite_timeout_fallback(test_user):
    # 12. Rewrite provider timeout
    # 15. Rewrite failure fallback
    rewriter = GeminiQueryRewriter()
    rewriter.enabled = True
    rewriter.client = MagicMock()
    
    # Simulate timeout
    rewriter.client.models.generate_content.side_effect = Exception("timed out")
    
    query = "How does it work in Aegis?"
    analysis = rewriter.analyze_and_rewrite(query)
    
    assert analysis.requires_rewrite is False
    assert analysis.fallback_used is True
    assert analysis.rewritten_query == "How does it work in Aegis?"

def test_malformed_json_fallback(test_user):
    # 14. Malformed structured response
    rewriter = GeminiQueryRewriter()
    rewriter.enabled = True
    rewriter.client = MagicMock()
    
    mock_response = MagicMock()
    mock_response.text = 'invalid json {['
    rewriter.client.models.generate_content.return_value = mock_response
    
    query = "What happens to the API Gateway?"
    analysis = rewriter.analyze_and_rewrite(query)
    
    assert analysis.requires_rewrite is False
    assert analysis.fallback_used is True
    assert analysis.rewritten_query == "What happens to the API Gateway?"

@patch("app.api.routes.chat.RetrievalPipeline")
@patch("app.api.routes.chat.ContextAssembler")
@patch("app.api.routes.chat.get_query_provider")
def test_retrieval_receives_rewritten_and_generation_receives_original(mock_get_query_provider, mock_context_assembler, mock_pipeline):
    # 19. Retrieval receives rewritten query
    # 20. Generation receives original query
    # 21. Layer 9 compatible
    # 22. Layer 10 compatible
    
    # Setup mock query provider
    mock_query_provider = MagicMock()
    mock_analysis = QueryAnalysis(
        original_query="What is it?",
        normalized_query="What is it?",
        rewritten_query="What is Aegis?",
        requires_rewrite=True,
        query_type="factual"
    )
    mock_query_provider.analyze_and_rewrite.return_value = mock_analysis
    mock_get_query_provider.return_value = mock_query_provider
    
    # Setup mock retrieval pipeline
    mock_pipeline_instance = MagicMock()
    mock_pipeline.return_value = mock_pipeline_instance
    mock_pipeline_instance.retrieve.return_value = SearchResponse(query="What is Aegis?", original_query="What is it?", results=[], result_count=0)
    
    # Setup mock Context Assembler
    mock_assembler_instance = MagicMock()
    mock_context_assembler.return_value = mock_assembler_instance
    mock_assembler_instance.assemble.return_value = MagicMock(items=[])
    
    # Setup mock LLM provider
    mock_llm_provider = MagicMock()
    mock_llm_provider.generate.return_value = GenerationResult(answer="Aegis is a system.", citations=[], model="mock", finish_reason="stop", input_context_items=0, generation_latency_ms=1.0)
    
    # Execute request
    req = ChatRequest(query="What is it?", top_k=5)
    db = MagicMock()
    emb = MagicMock()
    
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()
    
    chat(request=req, db=db, embedding_provider=emb, llm_provider=mock_llm_provider, current_user=mock_user)
    
    # Verify retrieval received rewritten query
    search_req_arg = mock_pipeline_instance.retrieve.call_args[0][0]
    assert search_req_arg.query == "What is Aegis?"
    assert search_req_arg.original_query == "What is it?"
    
    # Verify generation received original query
    mock_llm_provider.generate.assert_called_once()
    assert mock_llm_provider.generate.call_args[1]["query"] == "What is it?"
