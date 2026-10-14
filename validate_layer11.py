import os
import sys
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.db.database import SessionLocal
from app.retrieval.hybrid import HybridRetriever
from app.embeddings.provider import get_embedding_provider
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
    provider = get_embedding_provider()
    
    print("="*60)
    print("LAYER 11 — HYBRID RETRIEVAL VALIDATION")
    print("="*60)
    
    retriever = HybridRetriever(session=db, provider=provider)
    
    for query in queries:
        print(f"\nQUERY: '{query}'")
        
        results = {}
        for mode in ["dense", "keyword", "hybrid"]:
            retriever.mode = mode
            req = SearchRequest(query=query, top_k=5)
            
            start = time.perf_counter()
            resp = retriever.retrieve(req)
            lat = (time.perf_counter() - start) * 1000
            
            chunks_str = ", ".join([str(r.page_number) for r in resp.results])
            print(f"  {mode.upper():7s} | Latency: {lat:6.1f}ms | Pages: [{chunks_str}] | Count: {resp.result_count}")
            
if __name__ == "__main__":
    main()
