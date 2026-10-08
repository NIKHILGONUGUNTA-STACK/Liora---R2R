import time
import uuid
from typing import List, Dict
from sqlalchemy.orm import Session
from app.db.models.document import DocumentChunk, Document
from app.schemas.search import SearchResult
from app.core.config import settings
from app.core.logging import logger

class AdvancedContextProcessor:
    def __init__(self, session: Session):
        self.session = session
        self.enabled = getattr(settings, "CONTEXT_EXPANSION_ENABLED", True)
        self.window = getattr(settings, "CONTEXT_NEIGHBOR_WINDOW", 1)
        self.max_base_results = getattr(settings, "CONTEXT_EXPANSION_MAX_BASE_RESULTS", 3)
        self.max_expanded_chunks = getattr(settings, "CONTEXT_MAX_EXPANDED_CHUNKS", 10)
        self.max_per_doc = getattr(settings, "MAX_RESULTS_PER_DOCUMENT", 5)
        self.final_top_k = getattr(settings, "FINAL_TOP_K", 5)

    def process(self, results: List[SearchResult]) -> List[SearchResult]:
        start_time = time.perf_counter()
        
        if not self.enabled or not results:
            return self._diversify(results)[:self.final_top_k]

        # 1. Neighbor Expansion
        expanded_pool = self._expand_neighbors(results)
        
        # 2. Deduplication
        deduped = self._deduplicate(expanded_pool)
        
        # 3. Diversification
        final_results = self._diversify(deduped)
        
        # 4. Enforce Budget
        final_results = final_results[:self.final_top_k]

        latency = (time.perf_counter() - start_time) * 1000
        logger.info(f"Context processor complete | in: {len(results)} | out: {len(final_results)} | latency: {latency:.1f}ms")
        return final_results

    def _expand_neighbors(self, results: List[SearchResult]) -> List[SearchResult]:
        if self.window <= 0:
            return results
            
        pool = {str(r.chunk_id): r for r in results}
        
        # Only expand the highest-confidence candidates
        base_results = results[:self.max_base_results]
        
        expansion_queries = []
        base_lookup = {}
        for base in base_results:
            target_indices = []
            for offset in range(-self.window, self.window + 1):
                if offset == 0:
                    continue
                neighbor_idx = base.chunk_index + offset
                if neighbor_idx >= 0:
                    target_indices.append((base.document_id, neighbor_idx, offset))
                    base_lookup[(str(base.document_id), neighbor_idx)] = base
            expansion_queries.extend(target_indices)
            
        if not expansion_queries:
            return list(pool.values())
            
        # Bulk fetch neighbors to avoid N+1
        # Build OR conditions for (document_id, chunk_index)
        from sqlalchemy import tuple_
        
        condition_tuples = [(doc_id, idx) for doc_id, idx, _ in expansion_queries]
        if condition_tuples:
            neighbors = (
                self.session.query(DocumentChunk)
                .join(Document)
                .filter(tuple_(DocumentChunk.document_id, DocumentChunk.chunk_index).in_(condition_tuples))
                .all()
            )
            
            # Create a lookup for offsets
            offset_lookup = {(str(d), i): o for d, i, o in expansion_queries}
            
            expanded_count = 0
            for chunk in neighbors:
                if expanded_count >= self.max_expanded_chunks:
                    break
                    
                chunk_id_str = str(chunk.id)
                # If already in pool, we don't overwrite retrieved=True
                if chunk_id_str in pool:
                    pool[chunk_id_str].context_expanded = True
                    continue
                    
                offset = offset_lookup.get((str(chunk.document_id), chunk.chunk_index), 0)
                base = base_lookup.get((str(chunk.document_id), chunk.chunk_index))
                
                # Inherit scores from base chunk so they survive diversification, with a small penalty
                # to ensure the base chunk is prioritized if there's a tie.
                r_score = base.rerank_score - 0.001 if base and base.rerank_score is not None else None
                rrf_sc = base.rrf_score - 0.001 if base and base.rrf_score is not None else None
                sim = base.similarity - 0.001 if base and base.similarity is not None else 0.0
                dist = base.distance + 0.001 if base and base.distance is not None else 1.0

                # Fabricate SearchResult for neighbor (retrieved = False)
                sr = SearchResult(
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    content=chunk.content,
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    source_type=chunk.document.doc_metadata.get("source_type", "pdf"),
                    source_name=chunk.document.title,
                    filename=chunk.document.filename,
                    distance=dist,
                    similarity=sim,
                    rrf_score=rrf_sc,
                    rerank_score=r_score,
                    metadata=chunk.doc_metadata,
                    retrieved=False,
                    context_expanded=True,
                    expansion_distance=abs(offset)
                )
                pool[chunk_id_str] = sr
                expanded_count += 1
                
        return list(pool.values())

    def _deduplicate(self, results: List[SearchResult]) -> List[SearchResult]:
        # Deduplicate by chunk_id, preserving the one with highest relevance if any conflicts
        # (Our pool logic already prevents overriding higher-quality retrieved chunks with neighbors)
        seen = {}
        for r in results:
            cid = str(r.chunk_id)
            if cid not in seen:
                seen[cid] = r
            else:
                # If we encounter a duplicate, prefer the one that was 'retrieved' or has better score
                existing = seen[cid]
                if r.retrieved and not existing.retrieved:
                    seen[cid] = r
                elif r.rerank_score is not None and existing.rerank_score is not None and r.rerank_score > existing.rerank_score:
                    seen[cid] = r
        return list(seen.values())

    def _diversify(self, results: List[SearchResult]) -> List[SearchResult]:
        # Sort by best score: rerank_score first, then rrf_score, then similarity
        def sort_key(r: SearchResult):
            score1 = r.rerank_score if r.rerank_score is not None else -9999.0
            score2 = r.rrf_score if r.rrf_score is not None else -9999.0
            score3 = r.similarity if r.similarity is not None else -9999.0
            return (score1, score2, score3)
            
        sorted_results = sorted(results, key=sort_key, reverse=True)
        
        doc_counts: Dict[str, int] = {}
        diverse_results = []
        fallbacks = []
        
        for r in sorted_results:
            did = str(r.document_id)
            count = doc_counts.get(did, 0)
            
            if count < self.max_per_doc:
                diverse_results.append(r)
                doc_counts[did] = count + 1
            else:
                fallbacks.append(r)
                
        # If we need more to hit final_top_k, use fallbacks
        if len(diverse_results) < self.final_top_k and fallbacks:
            needed = self.final_top_k - len(diverse_results)
            diverse_results.extend(fallbacks[:needed])
            
        return diverse_results
