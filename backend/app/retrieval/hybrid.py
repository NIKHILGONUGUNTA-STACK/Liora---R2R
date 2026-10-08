import time
from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.embeddings.base import EmbeddingProvider
from app.retrieval.retriever import VectorRetriever
from app.retrieval.keyword import KeywordRetriever
from app.retrieval.rrf import apply_rrf
from app.core.config import settings
from app.core.logging import logger

class HybridRetriever:
    def __init__(self, session: Session, provider: EmbeddingProvider):
        self.session = session
        self.provider = provider
        self.vector_retriever = VectorRetriever(session, provider)
        self.keyword_retriever = KeywordRetriever(session)
        
        self.mode = getattr(settings, "RETRIEVAL_MODE", "hybrid")
        self.dense_top_k = getattr(settings, "DENSE_TOP_K", 10)
        self.keyword_top_k = getattr(settings, "KEYWORD_TOP_K", 10)
        self.final_top_k = getattr(settings, "FINAL_TOP_K", 5)
        self.rrf_k = getattr(settings, "RRF_K", 60)

    def retrieve(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()
        query_text = request.query.strip()
        
        if not query_text:
            raise ValueError("Query cannot be empty")
            
        logger.info(f"Starting retrieval for query: '{query_text}' with mode '{self.mode}'")

        # Dense Retrieval
        dense_results = []
        emb_latency = 0.0
        if self.mode in ["dense", "hybrid"]:
            dense_request = SearchRequest(query=query_text, top_k=self.dense_top_k, filter=request.filter)
            dense_response = self.vector_retriever.retrieve(dense_request)
            dense_results = dense_response.results
            emb_latency = dense_response.embedding_latency_ms
            
        # Keyword Retrieval
        keyword_results = []
        if self.mode in ["keyword", "hybrid"]:
            keyword_request = SearchRequest(query=query_text, top_k=self.keyword_top_k, filter=request.filter)
            keyword_response = self.keyword_retriever.retrieve(keyword_request)
            keyword_results = keyword_response.results
            
        # Fusion
        final_results = []
        rrf_latency = 0.0
        
        rrf_start = time.perf_counter()
        if self.mode == "hybrid":
            final_results = apply_rrf(
                results_lists=[dense_results, keyword_results],
                k=self.rrf_k,
                limit=self.final_top_k
            )
        elif self.mode == "dense":
            final_results = dense_results[:self.final_top_k]
        elif self.mode == "keyword":
            final_results = keyword_results[:self.final_top_k]
            
        rrf_latency = (time.perf_counter() - rrf_start) * 1000
        
        total_latency = (time.perf_counter() - start_time) * 1000
        
        logger.info(
            f"Retrieval complete | mode: {self.mode} | "
            f"dense_cnt: {len(dense_results)} | "
            f"keyword_cnt: {len(keyword_results)} | "
            f"final_cnt: {len(final_results)} | "
            f"Latency: Total={total_latency:.1f}ms, RRF={rrf_latency:.1f}ms"
        )
        
        return SearchResponse(
            query=query_text,
            results=final_results,
            result_count=len(final_results),
            latency_ms=total_latency,
            embedding_latency_ms=emb_latency,
            db_search_latency_ms=0.0 # Handled in underlying logs
        )
