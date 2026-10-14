import os
import sys
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.database import SessionLocal
from app.retrieval.hybrid import HybridRetriever
from app.retrieval.pipeline import RetrievalPipeline
from app.reranking.provider import get_reranker
from app.embeddings.provider import get_embedding_provider
from app.schemas.search import SearchRequest
from app.query.rewriter import GeminiQueryRewriter
from app.core.config import settings

def run_validation():
    db = SessionLocal()
    embedding_provider = get_embedding_provider()
    hybrid_retriever = HybridRetriever(session=db, provider=embedding_provider)
    reranker = get_reranker()
    pipeline = RetrievalPipeline(retriever=hybrid_retriever, reranker=reranker)
    rewriter = GeminiQueryRewriter()
    
    queries = [
        "What is Aegis?",
        "What problem does Aegis solve?",
        "What are the main components of Aegis?",
        "How does Aegis detect API access anomalies?",
        "What technologies are used in Aegis?",
        "Why does it need security intelligence?"
    ]
    
    print("="*80)
    print("LAYER 13 - QUERY REWRITING VALIDATION (COMPARISON)")
    print("="*80)
    
    for q in queries:
        print(f"\nQUERY: '{q}'")
        
        # --- A. No Rewrite (Layer 12 Baseline) ---
        start_a = time.perf_counter()
        req_a = SearchRequest(query=q, top_k=5)
        resp_a = pipeline.retrieve(req_a)
        lat_a_retrieval = (time.perf_counter() - start_a) * 1000
        pages_a = [str(r.page_number) for r in resp_a.results]
        
        # --- B. With Rewrite (Layer 13) ---
        start_b = time.perf_counter()
        
        # Query Understanding Phase
        analysis = rewriter.analyze_and_rewrite(q)
        lat_b_rewrite = analysis.rewrite_latency_ms
        
        # Retrieval Phase
        req_b = SearchRequest(query=analysis.rewritten_query, original_query=q, top_k=5)
        resp_b = pipeline.retrieve(req_b)
        
        # Reranking is embedded in pipeline.retrieve
        # The pipeline logs detailed latency but we get total retrieval latency
        lat_b_retrieval_and_rerank = (time.perf_counter() - start_b) * 1000 - lat_b_rewrite
        lat_b_total = lat_b_rewrite + lat_b_retrieval_and_rerank
        pages_b = [str(r.page_number) for r in resp_b.results]
        
        print("  Query Analysis:")
        print(f"    Normalized : '{analysis.normalized_query}'")
        print(f"    Rewritten  : '{analysis.rewritten_query}'")
        print(f"    Type       : {analysis.query_type}")
        print(f"    Rewrote?   : {analysis.requires_rewrite}")
        if analysis.requires_rewrite:
            print(f"    Reason     : {analysis.rewrite_reason}")
            
        print("  Comparison:")
        print(f"    A. No Rewrite | Latency: {lat_a_retrieval:6.1f}ms | Pages: [{', '.join(pages_a)}]")
        print(f"    B. Rewrite    | Rewrite: {lat_b_rewrite:6.1f}ms | Retrieval: {lat_b_retrieval_and_rerank:6.1f}ms | Total: {lat_b_total:6.1f}ms | Pages: [{', '.join(pages_b)}]")

if __name__ == "__main__":
    run_validation()
