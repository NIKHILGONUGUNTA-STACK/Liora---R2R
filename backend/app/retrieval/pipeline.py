import time
from typing import Optional
from app.schemas.search import SearchRequest, SearchResponse
from app.retrieval.hybrid import HybridRetriever
from app.reranking.base import Reranker
from app.core.config import settings
from app.core.logging import logger
from app.retrieval.context_processor import AdvancedContextProcessor

class RetrievalPipeline:
    def __init__(self, retriever: HybridRetriever, reranker: Optional[Reranker] = None):
        self.retriever = retriever
        self.reranker = reranker
        self.enabled = getattr(settings, "RERANKING_ENABLED", False) and self.reranker is not None
        self.candidate_top_k = getattr(settings, "RERANKER_CANDIDATE_TOP_K", 20)
        self.final_top_k = getattr(settings, "RERANKER_FINAL_TOP_K", 5)

    def retrieve(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()
        
        # Determine candidate count
        # If reranking is enabled, we override the request's top_k to fetch a larger candidate pool.
        # But wait, HybridRetriever uses its own config for FINAL_TOP_K.
        # We temporarily override HybridRetriever's final_top_k
        original_hybrid_final = self.retriever.final_top_k
        
        if self.enabled:
            self.retriever.final_top_k = self.candidate_top_k
            
        try:
            # 1. Retrieval
            retrieval_response = self.retriever.retrieve(request)
            
            # 2. Reranking
            if self.enabled:
                rerank_start = time.perf_counter()
                reranked_results = self.reranker.rerank(
                    query=request.query, 
                    candidates=retrieval_response.results, 
                    top_k=self.final_top_k
                )
                rerank_latency = (time.perf_counter() - rerank_start) * 1000
                
                # 3. Layer 14 Context Processing
                # Initialize Context Processor using the session from retriever
                processor = AdvancedContextProcessor(session=self.retriever.session)
                final_results = processor.process(reranked_results)
                
                total_latency = (time.perf_counter() - start_time) * 1000
                logger.info(f"Retrieval pipeline complete | reranked: True | final count: {len(final_results)} | latency: {total_latency:.1f}ms")
                
                return SearchResponse(
                    query=request.query,
                    results=final_results,
                    result_count=len(final_results),
                    latency_ms=total_latency,
                    embedding_latency_ms=retrieval_response.embedding_latency_ms,
                    db_search_latency_ms=retrieval_response.db_search_latency_ms
                )
            else:
                # 3. Layer 14 Context Processing (Without Reranking)
                processor = AdvancedContextProcessor(session=self.retriever.session)
                final_results = processor.process(retrieval_response.results)
                
                total_latency = (time.perf_counter() - start_time) * 1000
                logger.info(f"Retrieval pipeline complete | reranked: False | final count: {len(final_results)} | latency: {total_latency:.1f}ms")
                
                retrieval_response.results = final_results
                retrieval_response.result_count = len(final_results)
                retrieval_response.latency_ms = total_latency
                return retrieval_response
                
        finally:
            # Restore the retriever's original final_top_k in case it's shared across threads (though unlikely since session is request-scoped)
            self.retriever.final_top_k = original_hybrid_final
