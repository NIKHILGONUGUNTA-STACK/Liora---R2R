import logging
from typing import List, Dict, Any, Optional
from app.rag.models import ContextItem, ContextPackage
from app.schemas.search import SearchResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

class ContextAssembler:
    """
    Transforms Layer 8 search results into a clean, bounded, 
    deterministic ContextPackage for Layer 10 (LLM).
    """
    def __init__(self, 
                 max_chunks: Optional[int] = None, 
                 max_chars: Optional[int] = None, 
                 min_relevance_score: Optional[float] = None):
        self.max_chunks = max_chunks if max_chunks is not None else settings.MAX_CONTEXT_CHUNKS
        self.max_chars = max_chars if max_chars is not None else settings.MAX_CONTEXT_CHARS
        self.min_relevance_score = min_relevance_score if min_relevance_score is not None else settings.MIN_RELEVANCE_SCORE

    def assemble(self, search_response: SearchResponse) -> ContextPackage:
        query = search_response.query
        results = search_response.results
        
        retrieved_count = len(results)
        accepted_count = 0
        filtered_count = 0
        duplicate_count = 0
        
        seen_chunks = set()
        
        # 1. Relevance Filtering & Deduplication
        valid_items: List[ContextItem] = []
        for res in results:
            # Handle malformed records gracefully
            try:
                if not hasattr(res, 'chunk_id') or not res.chunk_id or not hasattr(res, 'content') or not res.content:
                    logger.warning(f"Skipping malformed chunk: missing id or content (doc_id={getattr(res, 'document_id', 'unknown')})")
                    continue
                if not hasattr(res, 'similarity') or res.similarity is None or not hasattr(res, 'distance') or res.distance is None:
                    logger.warning(f"Skipping malformed chunk: missing similarity or distance (chunk_id={getattr(res, 'chunk_id', 'unknown')})")
                    continue
            except Exception as e:
                logger.warning(f"Skipping malformed chunk due to error: {str(e)}")
                continue

            # Filtering based on similarity
            if res.similarity < self.min_relevance_score:
                filtered_count += 1
                continue
                
            # Deduplication
            chunk_key = f"{res.document_id}_{res.chunk_id}"
            if chunk_key in seen_chunks:
                duplicate_count += 1
                continue
            
            seen_chunks.add(chunk_key)
            accepted_count += 1
            
            valid_items.append(ContextItem(
                chunk_id=res.chunk_id,
                document_id=res.document_id,
                filename=res.filename,
                page_number=res.page_number,
                chunk_index=res.chunk_index,
                content=res.content,
                similarity=res.similarity,
                distance=res.distance,
                source_type=res.source_type,
                metadata=res.metadata or {}
            ))
            
        # 2. Context Ordering (Deterministic)
        # Primary: similarity descending
        # Secondary: document_id string ascending (tie-breaker)
        # Tertiary: chunk_index ascending (preserve document flow if from same document)
        valid_items.sort(key=lambda x: (-x.similarity, str(x.document_id), x.chunk_index))
        
        # 3. Context Budget
        final_items: List[ContextItem] = []
        current_chars = 0
        
        for item in valid_items:
            if len(final_items) >= self.max_chunks:
                break
                
            item_len = len(item.content)
            if current_chars + item_len > self.max_chars:
                # Skip this chunk if it exceeds the budget, prefer excluding over modifying
                continue
                
            final_items.append(item)
            current_chars += item_len
            
        final_context_count = len(final_items)
        
        retrieval_metadata = {
            "retrieved_count": retrieved_count,
            "accepted_count": accepted_count,
            "filtered_count": filtered_count,
            "duplicate_count": duplicate_count,
            "final_context_count": final_context_count,
            "final_context_characters": current_chars
        }
        
        logger.info(f"Context Assembly | Query: '{query}' | "
                    f"Retrieved: {retrieved_count} | Accepted: {accepted_count} | "
                    f"Filtered: {filtered_count} | Duplicates: {duplicate_count} | "
                    f"Final: {final_context_count} ({current_chars} chars)")
        
        return ContextPackage(
            query=query,
            items=final_items,
            total_items=final_context_count,
            total_characters=current_chars,
            retrieval_metadata=retrieval_metadata
        )
