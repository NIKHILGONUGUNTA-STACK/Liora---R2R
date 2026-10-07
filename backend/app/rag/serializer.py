from app.rag.models import ContextPackage

class ContextSerializer:
    """
    Serializes a ContextPackage deterministically into a text string
    for future LLM consumption.
    """
    def serialize(self, package: ContextPackage) -> str:
        if not package.items:
            return "Insufficient evidence available."
        
        serialized_parts = []
        for i, item in enumerate(package.items, 1):
            page_info = f"Page: {item.page_number}" if item.page_number is not None else "Page: N/A"
            part = (
                f"[Source {i}]\n"
                f"Document: {item.filename}\n"
                f"{page_info}\n"
                f"Chunk: {item.chunk_id}\n"
                f"Similarity: {item.similarity:.4f}\n\n"
                f"{item.content}"
            )
            serialized_parts.append(part)
            
        return "\n\n".join(serialized_parts)
