import chromadb
from typing import List, Dict, Any
from pathlib import Path
import hashlib

def get_chroma_client(db_path: Path) -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=str(db_path))

def init_db(db_path: Path):
    client = get_chroma_client(db_path)
    # Create the collection if it doesn't exist
    client.get_or_create_collection("documents")

def insert_chunk(db_path: Path, filename: str, text_chunk: str, page_number: int, embedding: List[float]):
    client = get_chroma_client(db_path)
    collection = client.get_or_create_collection("documents")
    
    # Generate a unique deterministic ID for the chunk
    chunk_hash = hashlib.md5(text_chunk.encode("utf-8")).hexdigest()
    chunk_id = f"{filename}_{page_number}_{chunk_hash}"
    
    # Insert the document chunk
    collection.add(
        ids=[chunk_id],
        embeddings=[embedding],
        documents=[text_chunk],
        metadatas=[{"filename": filename, "page_number": page_number}]
    )

def retrieve_similar_chunks(db_path: Path, query_embedding: List[float], filename: str = None, top_k: int = 5) -> List[Dict[str, Any]]:
    client = get_chroma_client(db_path)
    collection = client.get_or_create_collection("documents")
    
    # Apply metadata filtering if a filename is provided (document-scoped QA)
    where_filter = {"filename": filename} if filename else None
    
    # Catch if collection is empty
    if collection.count() == 0:
        return []

    # Chroma query returns distances (closer to 0 is better).
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )
    
    # Format results to match the previous API
    formatted_results = []
    if results["ids"] and len(results["ids"][0]) > 0:
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "filename": results["metadatas"][0][i]["filename"],
                "text_chunk": results["documents"][0][i],
                "page_number": results["metadatas"][0][i]["page_number"],
                "similarity": 1.0 - results["distances"][0][i]  # Chroma returns distance, we convert to pseudo-similarity
            })
            
    return formatted_results
