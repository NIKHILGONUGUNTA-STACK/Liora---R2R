import time
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, func
from app.db.models.document import DocumentChunk, Document
from app.schemas.search import SearchRequest, SearchResult, SearchResponse
from app.core.logging import logger

class KeywordRetriever:
    def __init__(self, session: Session):
        self.session = session

    def retrieve(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()
        
        query_text = request.query.strip()
        if not query_text:
            raise ValueError("Query cannot be empty")
            
        import re
        words = [w for w in re.split(r'\W+', query_text) if w]
        if not words:
            return SearchResponse(
                query=query_text,
                results=[],
                result_count=0,
                latency_ms=(time.perf_counter() - start_time) * 1000,
                embedding_latency_ms=0.0,
                db_search_latency_ms=0.0
            )
            
        # Join words with '|' (OR) so any matching word contributes to the rank
        query_or = ' | '.join(words)
        db_start = time.perf_counter()
        tsquery = func.to_tsquery('english', query_or)
        rank = func.ts_rank_cd(DocumentChunk.search_vector, tsquery).label('rank')
        
        query = (
            self.session.query(DocumentChunk, rank)
            .join(Document)
            .options(joinedload(DocumentChunk.document))
            .filter(DocumentChunk.search_vector.op('@@')(tsquery))
        )
        
        if request.filter:
            if request.filter.document_id:
                query = query.filter(Document.id == request.filter.document_id)
            if request.filter.filename:
                query = query.filter(Document.filename == request.filter.filename)
            if request.filter.source_type:
                query = query.filter(Document.doc_metadata['source_type'].astext == request.filter.source_type)
            if request.filter.page_number is not None:
                query = query.filter(DocumentChunk.page_number == request.filter.page_number)
                
        query = query.order_by(rank.desc()).limit(request.top_k)
        
        results_db = query.all()
        db_latency = (time.perf_counter() - db_start) * 1000
        
        search_results = []
        for chunk, chunk_rank in results_db:
            doc = chunk.document
            
            search_results.append(SearchResult(
                chunk_id=chunk.id,
                document_id=doc.id,
                content=chunk.content,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                source_type=doc.doc_metadata.get("source_type", "pdf"),
                source_name=doc.title,
                filename=doc.filename,
                distance=1.0 - float(chunk_rank), # Invert rank for a pseudo-distance if needed, or just let similarity=rank
                similarity=float(chunk_rank),
                metadata=chunk.doc_metadata
            ))
            
        total_latency = (time.perf_counter() - start_time) * 1000
        
        logger.info(f"Retrieved {len(search_results)} chunks (keyword) for query length {len(query_text)}. "
                    f"Latency: Total={total_latency:.1f}ms (DB={db_latency:.1f}ms)")
                    
        return SearchResponse(
            query=query_text,
            results=search_results,
            result_count=len(search_results),
            latency_ms=total_latency,
            embedding_latency_ms=0.0,
            db_search_latency_ms=db_latency
        )
