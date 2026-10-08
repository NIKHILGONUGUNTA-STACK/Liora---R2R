from typing import Optional
from pydantic import BaseModel, Field

class QueryAnalysis(BaseModel):
    original_query: str
    normalized_query: str
    rewritten_query: str
    query_type: str = "factual"
    requires_rewrite: bool = False
    rewrite_reason: Optional[str] = None
    rewrite_latency_ms: Optional[float] = None
    fallback_used: bool = False
