import time
from typing import List
from sentence_transformers import CrossEncoder
from app.reranking.base import Reranker
from app.schemas.search import SearchResult
from app.core.logging import logger

class CrossEncoderReranker(Reranker):
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        logger.info(f"Loading CrossEncoder model: {model_name}")
        self.model_name = model_name
        self.model = CrossEncoder(model_name)
        
    def rerank(self, query: str, candidates: List[SearchResult], top_k: int) -> List[SearchResult]:
        if not candidates:
            return []
            
        start_time = time.perf_counter()
        
        # Prepare pairs: (query, document_chunk_content)
        pairs = [[query, candidate.content] for candidate in candidates]
        
        # Score pairs
        scores = self.model.predict(pairs)
        
        # Zip candidates with their new scores
        scored_candidates = []
        for idx, (candidate, score) in enumerate(zip(candidates, scores)):
            updated_candidate = candidate.model_copy(update={"rerank_score": float(score)})
            scored_candidates.append(updated_candidate)
            
        # Sort by rerank_score descending
        scored_candidates.sort(key=lambda x: x.rerank_score, reverse=True)
        
        # Trim to top_k
        final_candidates = scored_candidates[:top_k]
        
        latency = (time.perf_counter() - start_time) * 1000
        logger.info(f"Reranked {len(candidates)} candidates down to {len(final_candidates)} in {latency:.1f}ms")
        
        return final_candidates
