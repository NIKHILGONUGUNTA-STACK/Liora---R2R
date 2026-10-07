import pytest
import uuid
from typing import List, Dict, Any
from unittest.mock import patch, MagicMock
from google.genai.errors import APIError

from app.schemas.generation import GenerationResult, Citation
from app.rag.models import ContextPackage, ContextItem
from app.generation.gemini import GeminiProvider

class MockGenerateContentResponse:
    def __init__(self, text):
        self.text = text

class MockModels:
    def __init__(self, response_text, raise_error=None, error_code=None, success_on_attempt=0):
        self.response_text = response_text
        self.raise_error = raise_error
        self.error_code = error_code
        self.success_on_attempt = success_on_attempt
        self.attempts = 0
        
    def generate_content(self, model, contents, config):
        self.attempts += 1
        if self.raise_error and self.attempts < self.success_on_attempt:
            # We want to emulate the new google-genai APIError pattern
            # It has a code attribute.
            err = self.raise_error
            if self.error_code:
                err.code = self.error_code
            raise err
        elif self.raise_error and self.success_on_attempt == 0:
            err = self.raise_error
            if self.error_code:
                err.code = self.error_code
            raise err
            
        return MockGenerateContentResponse(self.response_text)

class MockClient:
    def __init__(self, response_text="Test response", raise_error=None, error_code=None, success_on_attempt=0):
        self.models = MockModels(response_text, raise_error, error_code, success_on_attempt)

@pytest.fixture
def sample_context():
    return ContextPackage(
        query="What is Aegis?",
        items=[
            ContextItem(
                chunk_id=uuid.uuid4(),
                document_id=uuid.uuid4(),
                filename="Aegis.pdf",
                page_number=1,
                chunk_index=0,
                content="Aegis is an API defense platform.",
                similarity=0.9,
                distance=0.1,
                source_type="pdf"
            ),
            ContextItem(
                chunk_id=uuid.uuid4(),
                document_id=uuid.uuid4(),
                filename="Aegis.pdf",
                page_number=2,
                chunk_index=1,
                content="Aegis protects against threats.",
                similarity=0.8,
                distance=0.2,
                source_type="pdf"
            )
        ],
        total_items=2,
        total_characters=100
    )

def test_1_insufficient_evidence():
    provider = GeminiProvider()
    empty_context = ContextPackage(query="What?", items=[], total_items=0, total_characters=0)
    
    result = provider.generate("What?", empty_context)
    
    assert result.finish_reason == "insufficient_context"
    assert len(result.citations) == 0
    assert "do not contain enough information" in result.answer

@patch("app.generation.gemini.genai.Client")
def test_2_successful_generation(mock_client, sample_context):
    mock_client.return_value = MockClient(response_text="Aegis is a platform. [Source 1] It protects. [Source 2]")
    
    provider = GeminiProvider()
    provider.client = mock_client() # Inject mock
    
    result = provider.generate("What is Aegis?", sample_context)
    
    assert result.finish_reason == "stop"
    assert "Aegis is a platform." in result.answer
    assert len(result.citations) == 2
    
    # Check citations mapping
    cit1 = next(c for c in result.citations if c.source_id == "Source 1")
    assert cit1.page_number == 1
    
    cit2 = next(c for c in result.citations if c.source_id == "Source 2")
    assert cit2.page_number == 2

@patch("app.generation.gemini.genai.Client")
def test_3_fabricated_citation(mock_client, sample_context):
    # Model fabricates Source 3 and Source 99
    mock_client.return_value = MockClient(response_text="Fabricated [Source 3] and [Source 99]")
    
    provider = GeminiProvider()
    provider.client = mock_client()
    
    result = provider.generate("What is Aegis?", sample_context)
    
    # Provider should discard unknown citations safely
    assert len(result.citations) == 0

@patch("app.generation.gemini.genai.Client")
@patch("time.sleep", return_value=None)
def test_4_retry_transient_error(mock_sleep, mock_client, sample_context):
    # Fails 2 times with 503, succeeds on 3rd
    mock_client.return_value = MockClient(raise_error=APIError("Unavailable", 503, {}), error_code=503, success_on_attempt=3)
    
    provider = GeminiProvider()
    provider.client = mock_client()
    
    result = provider.generate("What is Aegis?", sample_context)
    
    assert result.finish_reason == "stop"
    assert provider.client.models.attempts == 3

@patch("app.generation.gemini.genai.Client")
@patch("time.sleep", return_value=None)
def test_4b_max_retry_exceeded(mock_sleep, mock_client, sample_context):
    # Fails with 503, never succeeds
    mock_client.return_value = MockClient(raise_error=APIError("Unavailable", 503, {}), error_code=503, success_on_attempt=0)
    
    provider = GeminiProvider()
    provider.client = mock_client()
    
    with pytest.raises(RuntimeError, match="Upstream provider error"):
        provider.generate("What is Aegis?", sample_context)
    
    assert provider.client.models.attempts == 3  # Max attempts is 3

@patch("app.generation.gemini.genai.Client")
def test_4c_permanent_error(mock_client, sample_context):
    # Fails with 400, no retries
    mock_client.return_value = MockClient(raise_error=APIError("Bad Request", 400, {}), error_code=400, success_on_attempt=0)
    
    provider = GeminiProvider()
    provider.client = mock_client()
    
    with pytest.raises(RuntimeError, match="Upstream provider error"):
        provider.generate("What is Aegis?", sample_context)
        
    assert provider.client.models.attempts == 1

@patch("app.generation.gemini.genai.Client")
def test_5_empty_response(mock_client, sample_context):
    mock_client.return_value = MockClient(response_text="")
    
    provider = GeminiProvider()
    provider.client = mock_client()
    
    with pytest.raises(RuntimeError, match="empty response"):
        provider.generate("What is Aegis?", sample_context)

def test_6_unauthenticated():
    with patch("app.generation.gemini.settings.GEMINI_API_KEY", new=""):
        provider = GeminiProvider()
        # Should set client to None
        assert provider.client is None
        
        # When context is present, it should fail
        with pytest.raises(ValueError, match="Gemini API key is not configured"):
            provider.generate("test", ContextPackage(query="test", items=[ContextItem(
                chunk_id=uuid.uuid4(), document_id=uuid.uuid4(), filename="f", page_number=1, chunk_index=1, content="t", similarity=1.0, distance=0.0, source_type="pdf"
            )], total_items=1, total_characters=1))
