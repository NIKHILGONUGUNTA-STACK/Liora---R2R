import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types

from liora.config import LioraConfig
from liora.db import init_db, insert_chunk, retrieve_similar_chunks

app = FastAPI(title="Liora AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = LioraConfig.from_env()
init_db(config.db_path)

print(f"Loading embedding model: {config.embedding_model}...")
embedding_model = SentenceTransformer(config.embedding_model)
print("Embedding model loaded.")

from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import Optional

class ChatRequest(BaseModel):
    query: str
    filename: Optional[str] = None

def chunk_text(text: str, chunk_size: int, chunk_overlap: int):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = config.upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        reader = PdfReader(file_path)
        chunks_added = 0
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_chunks = chunk_text(text, config.chunk_size, config.chunk_overlap)
                for chunk in text_chunks:
                    # Create embedding
                    embedding = embedding_model.encode(chunk).tolist()
                    insert_chunk(config.db_path, file.filename, chunk, i + 1, embedding)
                    chunks_added += 1
        
        return {"status": "success", "filename": file.filename, "chunks_added": chunks_added}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    query = request.query
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    # Retrieve similar chunks
    query_embedding = embedding_model.encode(query).tolist()
    results = retrieve_similar_chunks(config.db_path, query_embedding, filename=request.filename, top_k=config.top_k)
    
    if not results or results[0]['similarity'] <= 0.0:
        return {
            "answer": "I don't have enough information in the provided documents to answer this question.",
            "sources": []
        }
    
    # Construct context
    context = ""
    sources = []
    for i, res in enumerate(results):
        context += f"[Source {i+1}] (File: {res['filename']}, Page: {res['page_number']}):\n{res['text_chunk']}\n\n"
        sources.append({
            "filename": res['filename'],
            "page_number": res['page_number'],
            "chunk_id": res['id'],
            "similarity": res['similarity'],
            "text": res['text_chunk']
        })
        
    prompt = f"""You are Liora, an AI Knowledge Intelligence Platform assistant. 
Answer the user's question based ONLY on the provided context.
If the answer is not contained in the context, explicitly say that you cannot answer based on the documents.
Cite your sources in your answer using [Source X].

Context:
{context}

Question:
{query}
"""
    
    # Call Gemini API
    if not config.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")
        
    try:
        # Clear conflicting environment variables
        conflicting_vars = [
            "GOOGLE_API_KEY",
            "GOOGLE_GENAI_USE_ENTERPRISE",
            "GOOGLE_CLOUD_PROJECT", 
            "GOOGLE_CLOUD_LOCATION",
            "GOOGLE_APPLICATION_CREDENTIALS"
        ]
        for var in conflicting_vars:
            if var in os.environ:
                del os.environ[var]
        
        # Ensure GEMINI_API_KEY is exactly what is used
        os.environ["GEMINI_API_KEY"] = config.gemini_api_key
        
        client = genai.Client(
            api_key=os.environ["GEMINI_API_KEY"]
        )
        interaction = client.interactions.create(
            model="gemini-3.8-flash",
            input=prompt
        )
        answer = interaction.output_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
        
    return {
        "answer": answer,
        "sources": sources
    }

# Serve static files for UI
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    return FileResponse(static_dir / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.host, port=config.port)
