from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.chat import ChatRequest
from app.schemas.search import SearchRequest
from app.schemas.generation import GenerationResult
from app.retrieval.retriever import VectorRetriever
from app.embeddings.base import EmbeddingProvider
from app.embeddings.provider import get_embedding_provider
from app.generation.base import LLMProvider
from app.generation import get_llm_provider
from app.rag.context import ContextAssembler
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=GenerationResult, status_code=status.HTTP_200_OK)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
    llm_provider: LLMProvider = Depends(get_llm_provider)
):
    import uuid
    import time
    
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    try:
        # 1. & 2. & 3. Retrieval (Layer 8)
        retriever_start = time.time()
        retriever = VectorRetriever(session=db, provider=embedding_provider)
        search_req = SearchRequest(query=request.query, top_k=request.top_k)
        search_resp = retriever.retrieve(search_req)
        retrieval_latency = (time.time() - retriever_start) * 1000
        
        # 4. Context Assembly (Layer 9)
        assembler_start = time.time()
        assembler = ContextAssembler()
        context_package = assembler.assemble(search_resp)
        assembly_latency = (time.time() - assembler_start) * 1000
        
        # 5. & 6. & 7. Generation (Layer 10)
        generation_result = llm_provider.generate(query=request.query, context=context_package)
        total_latency = (time.time() - start_time) * 1000
        
        logger.info(
            "Chat Request Completed",
            extra={
                "request_id": request_id,
                "provider": "gemini",
                "model": getattr(generation_result, "model", "unknown"),
                "retrieval_latency_ms": retrieval_latency,
                "context_assembly_latency_ms": assembly_latency,
                "generation_latency_ms": getattr(generation_result, "generation_latency_ms", 0),
                "total_latency_ms": total_latency,
                "status": "success"
            }
        )
        
        return generation_result
        
    except ValueError as ve:
        logger.warning(
            f"Validation error during chat",
            extra={"request_id": request_id, "error_type": "ValueError", "status": "error"}
        )
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(
            f"Error during chat",
            extra={"request_id": request_id, "error_type": type(e).__name__, "status": "error"}
        )
        # Convert all other exceptions to a generic 500 error to avoid leaking traces
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
