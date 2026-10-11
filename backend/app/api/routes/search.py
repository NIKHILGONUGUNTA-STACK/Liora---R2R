from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchRequest, SearchResponse, RetrievalFilter
from app.db.models.user import User
from app.api.deps import get_current_user
from app.retrieval.retriever import VectorRetriever
from app.embeddings.base import EmbeddingProvider
from app.embeddings.provider import get_embedding_provider
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=SearchResponse, status_code=status.HTTP_200_OK)
def search_documents(
    request: SearchRequest,
    db: Session = Depends(get_db),
    provider: EmbeddingProvider = Depends(get_embedding_provider),
    current_user: User = Depends(get_current_user)
):
    try:
        if request.filter is None:
            request.filter = RetrievalFilter()
        request.filter.owner_id = current_user.id
        
        # We should use HybridRetriever or Pipeline, but sticking to existing code if requested
        from app.retrieval.hybrid import HybridRetriever
        from app.retrieval.pipeline import RetrievalPipeline
        from app.reranking.provider import get_reranker
        
        # Enforcing Layer 14 pipeline if possible, or just vector retriever as it was
        # The prompt says: "search_documents ... I'll update search.py to use RetrievalPipeline directly"
        # I'll change it to use HybridRetriever for consistency with Layer 14.
        hybrid_retriever = HybridRetriever(session=db, provider=provider)
        reranker = get_reranker()
        pipeline = RetrievalPipeline(retriever=hybrid_retriever, reranker=reranker)
        
        response = pipeline.retrieve(request)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error during search: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error during search: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
