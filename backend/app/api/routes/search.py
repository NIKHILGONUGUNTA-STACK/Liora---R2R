from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.retrieval.retriever import VectorRetriever
from app.embeddings.base import EmbeddingProvider
from app.embeddings.provider import get_embedding_provider
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=SearchResponse, status_code=status.HTTP_200_OK)
def search_documents(
    request: SearchRequest,
    db: Session = Depends(get_db),
    provider: EmbeddingProvider = Depends(get_embedding_provider)
):
    try:
        retriever = VectorRetriever(session=db, provider=provider)
        response = retriever.retrieve(request)
        return response
    except ValueError as ve:
        logger.warning(f"Validation error during search: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error during search: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
