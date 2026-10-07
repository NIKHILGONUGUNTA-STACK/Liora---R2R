import time
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.db.models.document import DocumentChunk, Document
from app.schemas.search import SearchRequest, SearchResult, SearchResponse
from app.embeddings.base import EmbeddingProvider
from app.core.logging import logger

class VectorRetriever:
    def __init__(self, session: Session, provider: EmbeddingProvider):
        self.session = session
        self.provider = provider

    def retrieve(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()
        
        # 1. Query Validation (already handled by SearchRequest schema, but we double check)
        query_text = request.query.strip()
        if not query_text:
            raise ValueError("Query cannot be empty")
            
        # 2. Query Embedding
        emb_start = time.perf_counter()
        query_vector = self.provider.embed_text(query_text)
        emb_latency = (time.perf_counter() - emb_start) * 1000
        
        # 3. Validate dimension
        if len(query_vector) != self.provider.dimension:
            raise ValueError(f"Query vector dimension mismatch. Expected {self.provider.dimension}, got {len(query_vector)}")
            
        # 4. Vector Search
        db_start = time.perf_counter()
        
        # We only search chunks that actually have an embedding
        # and we eager load the document to avoid N+1 queries.
        # We use cosine_distance for pgvector since Layer 7 used vector_cosine_ops
        query = (
            self.session.query(DocumentChunk, DocumentChunk.embedding.cosine_distance(query_vector).label('distance'))
            .join(Document)
            .options(joinedload(DocumentChunk.document))
            .filter(DocumentChunk.embedding.is_not(None))
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(request.top_k)
        )
        
        results_db = query.all()
        db_latency = (time.perf_counter() - db_start) * 1000
        
        # 5. Map to SearchResult
        search_results = []
        for chunk, distance in results_db:
            doc = chunk.document
            
            # Using cosine distance: similarity = 1 - distance
            similarity = 1.0 - float(distance)
            
            search_results.append(SearchResult(
                chunk_id=chunk.id,
                document_id=doc.id,
                content=chunk.content,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                source_type=doc.doc_metadata.get("source_type", "pdf"),
                source_name=doc.title,
                filename=doc.filename,
                distance=float(distance),
                similarity=similarity,
                metadata=chunk.doc_metadata
            ))
            
        total_latency = (time.perf_counter() - start_time) * 1000
        
        logger.info(f"Retrieved {len(search_results)} chunks for query length {len(query_text)}. "
                    f"Latency: Total={total_latency:.1f}ms (Emb={emb_latency:.1f}ms, DB={db_latency:.1f}ms)")
                    
        return SearchResponse(
            query=query_text,
            results=search_results,
            result_count=len(search_results),
            latency_ms=total_latency,
            embedding_latency_ms=emb_latency,
            db_search_latency_ms=db_latency
        )
