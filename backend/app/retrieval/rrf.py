from typing import List, Dict, Tuple
from app.schemas.search import SearchResult
import uuid

def apply_rrf(results_lists: List[List[SearchResult]], k: int = 60, limit: int = 5) -> List[SearchResult]:
    """
    Applies Reciprocal Rank Fusion (RRF) to multiple lists of search results.
    
    RRF score = sum(1 / (k + rank_in_list)) for each list where the item appears.
    Rank is 1-indexed.
    """
    scores: Dict[uuid.UUID, float] = {}
    items: Dict[uuid.UUID, SearchResult] = {}
    
    for result_list in results_lists:
        for idx, result in enumerate(result_list):
            rank = idx + 1
            score = 1.0 / (k + rank)
            
            chunk_id = result.chunk_id
            
            if chunk_id in scores:
                scores[chunk_id] += score
            else:
                scores[chunk_id] = score
                items[chunk_id] = result
                
    # Sort results
    # Primary sort: RRF score descending
    # Secondary sort: chunk_id ascending (deterministic tie-breaking)
    
    sorted_items = sorted(
        scores.items(), 
        key=lambda x: (-x[1], str(x[0]))
    )
    
    fused_results = []
    for chunk_id, score in sorted_items[:limit]:
        # Copy the original result and update the similarity/distance to reflect RRF score
        original = items[chunk_id]
        
        # We preserve the original metadata but override distance/similarity for downstream compatibility
        fused = SearchResult(
            chunk_id=original.chunk_id,
            document_id=original.document_id,
            content=original.content,
            page_number=original.page_number,
            chunk_index=original.chunk_index,
            source_type=original.source_type,
            source_name=original.source_name,
            filename=original.filename,
            distance=0.0, # distance isn't meaningful for RRF directly
            similarity=score,
            metadata=original.metadata
        )
        fused_results.append(fused)
        
    return fused_results
