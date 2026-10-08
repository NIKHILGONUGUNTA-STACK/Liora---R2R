from typing import Optional
from app.reranking.base import Reranker
from app.reranking.cross_encoder_reranker import CrossEncoderReranker
from app.core.config import settings
from app.core.logging import logger
import threading

_reranker_instance: Optional[Reranker] = None
_lock = threading.Lock()

def get_reranker() -> Optional[Reranker]:
    global _reranker_instance
    
    if getattr(settings, "RERANKING_ENABLED", False) is False:
        return None
        
    provider_name = getattr(settings, "RERANKER_PROVIDER", "cross_encoder")
    
    if _reranker_instance is None:
        with _lock:
            if _reranker_instance is None:
                if provider_name == "cross_encoder":
                    model_name = getattr(settings, "RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
                    _reranker_instance = CrossEncoderReranker(model_name=model_name)
                else:
                    logger.warning(f"Unknown reranker provider: {provider_name}. Reranking disabled.")
                    return None
                    
    return _reranker_instance
