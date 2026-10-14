import os
import sys
import time
from typing import Dict, Any

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.db.database import SessionLocal
from app.retrieval.hybrid import HybridRetriever
from app.embeddings.provider import get_embedding_provider
from app.reranking.provider import get_reranker
from app.retrieval.pipeline import RetrievalPipeline
from app.schemas.search import SearchRequest
from app.core.config import settings

def main():
    queries = [
        "What is Aegis?",
        "What problem does Aegis solve?",
        "What are the main components of Aegis?",
        "What technologies are used in Aegis?",
        "What is the role of the API Gateway?"
    ]
    
    db = SessionLocal()
    embedding_provider = get_embedding_provider()
    
    print("="*80)
    print("LAYER 12 — RERANKING VALIDATION")
    print("="*80)
    
    # Pre-load reranker to isolate load time
    load_start = time.perf_counter()
    reranker = get_reranker()
    load_latency = (time.perf_counter() - load_start) * 1000
    print(f"Reranker Model Load Time: {load_latency:.1f}ms")
    print("="*80)
    
    hybrid_retriever = HybridRetriever(session=db, provider=embedding_provider)
    pipeline = RetrievalPipeline(retriever=hybrid_retriever, reranker=reranker)
    
    for query in queries:
        print(f"\nQUERY: '{query}'")
        req = SearchRequest(query=query, top_k=5)
        
        # 1. DENSE
        settings.RETRIEVAL_MODE = "dense"
        settings.RERANKING_ENABLED = False
        pipeline.enabled = False
        hybrid_retriever.mode = "dense"
        
        dense_start = time.perf_counter()
        dense_resp = pipeline.retrieve(req)
        dense_lat = (time.perf_counter() - dense_start) * 1000
        dense_pages = [r.page_number for r in dense_resp.results]
        
        # 2. HYBRID
        settings.RETRIEVAL_MODE = "hybrid"
        settings.RERANKING_ENABLED = False
        pipeline.enabled = False
        hybrid_retriever.mode = "hybrid"
        
        hybrid_start = time.perf_counter()
        hybrid_resp = pipeline.retrieve(req)
        hybrid_lat = (time.perf_counter() - hybrid_start) * 1000
        hybrid_pages = [r.page_number for r in hybrid_resp.results]
        
        # 3. HYBRID + RERANKING
        settings.RERANKING_ENABLED = True
        pipeline.enabled = True
        hybrid_retriever.mode = "hybrid"
        
        rr_start = time.perf_counter()
        rr_resp = pipeline.retrieve(req)
        rr_lat = (time.perf_counter() - rr_start) * 1000
        rr_pages = [r.page_number for r in rr_resp.results]
        
        print(f"  DENSE          | Latency: {dense_lat:6.1f}ms | Pages: {dense_pages}")
        print(f"  HYBRID         | Latency: {hybrid_lat:6.1f}ms | Pages: {hybrid_pages}")
        print(f"  HYBRID+RERANK  | Latency: {rr_lat:6.1f}ms | Pages: {rr_pages}")
        
        if rr_resp.results:
            first_r = rr_resp.results[0]
            print(f"      Top Chunk: {first_r.content[:80]}...")
            print(f"      RRF Score: {first_r.similarity:.4f} | Rerank Score: {getattr(first_r, 'rerank_score', 'N/A')}")
            
if __name__ == "__main__":
    main()
