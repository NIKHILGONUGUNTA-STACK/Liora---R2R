from typing import Optional
from app.query.base import QueryUnderstandingProvider
from app.query.rewriter import GeminiQueryRewriter
from app.core.config import settings
from app.core.logging import logger
import threading

_query_provider_instance: Optional[QueryUnderstandingProvider] = None
_lock = threading.Lock()

def get_query_provider() -> Optional[QueryUnderstandingProvider]:
    global _query_provider_instance
    
    if getattr(settings, "QUERY_REWRITING_ENABLED", True) is False:
        return None
        
    provider_name = getattr(settings, "QUERY_REWRITE_PROVIDER", "gemini")
    
    if _query_provider_instance is None:
        with _lock:
            if _query_provider_instance is None:
                if provider_name == "gemini":
                    _query_provider_instance = GeminiQueryRewriter()
                else:
                    logger.warning(f"Unknown query provider: {provider_name}. Query rewriting disabled.")
                    return None
                    
    return _query_provider_instance
