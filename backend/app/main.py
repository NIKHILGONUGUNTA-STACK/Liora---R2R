from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import health, documents, search, chat, auth
from app.core.exceptions import LioraException, liora_exception_handler
from app.core.config import settings
from app.core.logging import logger

app = FastAPI(title="Liora Production API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
app.add_exception_handler(LioraException, liora_exception_handler)

app.include_router(health.router, prefix="/api/v1", tags=["system"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

from app.worker import IngestionWorker
import asyncio

worker = IngestionWorker()

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    asyncio.create_task(worker.run())

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")
    worker.stop()
