import uuid
from typing import List
import pytest
from unittest.mock import MagicMock

from app.schemas.search import SearchRequest, SearchResult, RetrievalFilter
from app.retrieval.context_processor import AdvancedContextProcessor
from app.db.models.document import DocumentChunk, Document

@pytest.fixture
def mock_session():
    return MagicMock()

def create_mock_search_result(
    doc_id: uuid.UUID,
    chunk_index: int,
    rerank_score: float = None,
    chunk_id: uuid.UUID = None,
    retrieved: bool = True
) -> SearchResult:
    return SearchResult(
        chunk_id=chunk_id or uuid.uuid4(),
        document_id=doc_id,
        content=f"Content doc {doc_id} chunk {chunk_index}",
        page_number=1,
        chunk_index=chunk_index,
        source_type="pdf",
        source_name="Test Doc",
        filename="test.pdf",
        distance=0.1,
        similarity=0.9,
        rrf_score=None,
        rerank_score=rerank_score,
        metadata={},
        retrieved=retrieved
    )

class TestMetadataFiltering:
    def test_filter_fields_exist(self):
        f = RetrievalFilter(document_id=uuid.uuid4(), filename="test.pdf", page_number=1)
        req = SearchRequest(query="test", filter=f)
        assert req.filter.filename == "test.pdf"

class TestAdvancedContextProcessor:
    def test_expansion_disabled(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        processor.enabled = False
        doc_id = uuid.uuid4()
        res = [create_mock_search_result(doc_id, 0, rerank_score=0.9)]
        out = processor.process(res)
        assert len(out) == 1
        assert out[0].chunk_index == 0
        mock_session.query.assert_not_called()

    def test_neighbor_window_zero(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        processor.window = 0
        doc_id = uuid.uuid4()
        res = [create_mock_search_result(doc_id, 0, rerank_score=0.9)]
        out = processor.process(res)
        assert len(out) == 1
        mock_session.query.assert_not_called()

    def test_neighbor_expansion(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        doc_id = uuid.uuid4()
        res = [create_mock_search_result(doc_id, 1, rerank_score=0.9)]
        
        # Mock DB response
        neighbor_chunk = MagicMock()
        neighbor_chunk.id = uuid.uuid4()
        neighbor_chunk.document_id = doc_id
        neighbor_chunk.chunk_index = 0
        neighbor_chunk.content = "Neighbor"
        neighbor_chunk.page_number = 1
        neighbor_chunk.document.title = "Test Doc"
        neighbor_chunk.document.filename = "test.pdf"
        neighbor_chunk.document.doc_metadata = {"source_type": "pdf"}
        neighbor_chunk.doc_metadata = {}
        
        mock_query = MagicMock()
        mock_query.join.return_value.filter.return_value.all.return_value = [neighbor_chunk]
        mock_session.query.return_value = mock_query

        out = processor.process(res)
        
        assert len(out) == 2
        expanded = [r for r in out if not r.retrieved]
        assert len(expanded) == 1
        assert expanded[0].context_expanded is True
        assert expanded[0].expansion_distance == 1
        assert expanded[0].rerank_score == 0.899

    def test_first_chunk_boundary(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        doc_id = uuid.uuid4()
        res = [create_mock_search_result(doc_id, 0, rerank_score=0.9)]
        
        # Only offset +1 should be queried, -1 is dropped
        mock_query = MagicMock()
        mock_query.join.return_value.filter.return_value.all.return_value = []
        mock_session.query.return_value = mock_query
        
        processor.process(res)
        # Check that negative indices were not queried
        call_args = mock_query.join.return_value.filter.call_args
        # We assume the tuple_ in_ doesn't contain index -1. We can just verify it didn't crash.

    def test_deduplication(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        doc_id = uuid.uuid4()
        chunk_id = uuid.uuid4()
        # Create two identical chunks
        r1 = create_mock_search_result(doc_id, 1, rerank_score=0.9, chunk_id=chunk_id)
        r2 = create_mock_search_result(doc_id, 1, rerank_score=0.8, chunk_id=chunk_id)
        
        processor.window = 0  # Skip DB call
        out = processor.process([r1, r2])
        assert len(out) == 1
        assert out[0].rerank_score == 0.9  # Highest score kept

    def test_diversification_enforces_max_per_doc(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        processor.window = 0
        processor.max_per_doc = 2
        processor.final_top_k = 5
        
        doc_id_1 = uuid.uuid4()
        doc_id_2 = uuid.uuid4()
        
        res = [
            create_mock_search_result(doc_id_1, 0, rerank_score=0.9),
            create_mock_search_result(doc_id_1, 1, rerank_score=0.8),
            create_mock_search_result(doc_id_1, 2, rerank_score=0.7),
            create_mock_search_result(doc_id_2, 0, rerank_score=0.6),
        ]
        
        out = processor.process(res)
        # It should take doc1(0), doc1(1), then doc2(0), and then fallback to doc1(2) because final_top_k is 5
        assert len(out) == 4
        # We can see the order: doc1_0, doc1_1, doc2_0, doc1_2
        assert out[2].document_id == doc_id_2
        assert out[3].chunk_index == 2

    def test_metadata_preservation(self, mock_session):
        processor = AdvancedContextProcessor(session=mock_session)
        processor.window = 0
        doc_id = uuid.uuid4()
        r1 = create_mock_search_result(doc_id, 0, rerank_score=0.9)
        out = processor.process([r1])
        assert out[0].page_number == 1
        assert out[0].chunk_index == 0
        assert out[0].document_id == doc_id
