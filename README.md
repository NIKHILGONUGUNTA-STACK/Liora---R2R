# Liora — Knowledge Intelligence Platform

Liora is a modern, production-grade Retrieval-Augmented Generation (RAG) platform. It provides an intelligent pipeline for ingesting documents, extracting semantic context, and reasoning over private knowledge bases using Google Gemini LLMs.

**Note**: This repository was originally a fork of an open-source project but is currently undergoing a complete from-scratch structural rebuild to establish a custom, production-ready enterprise architecture.

---

## 🏗️ Architecture (Layer 1 — Foundation)

We are currently implementing **Layer 1** of our rebuild plan, which establishes the core engineering foundation required for a production-grade RAG application.

### Current System Layout

```text
backend/
├── app/
│   ├── api/          # FastAPI Routes (e.g., /health, /ready)
│   ├── core/         # Centralized configuration and exception handling
│   ├── db/           # SQLAlchemy & PostgreSQL connection logic
│   ├── providers/    # Interfaces for LLM and Embedding services
│   ├── rag/          # Placeholder for future RAG components
│   └── main.py       # FastAPI Application Factory
├── tests/            # Pytest suite
├── Dockerfile        # Containerization for the API
└── docker-compose.yml# Orchestration for the API and PostgreSQL DB
```

### Tech Stack
- **API Framework:** FastAPI
- **Database:** PostgreSQL (with SQLAlchemy ORM)
- **Migrations:** Alembic
- **Validation:** Pydantic
- **Testing:** Pytest

*(Note: The actual RAG pipeline—including semantic chunking, embeddings, pgvector search, and Gemini integration—will be implemented in upcoming layers. Right now, this foundation ensures the app is robust, testable, and scalable.)*

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Docker & Docker Compose** (for running the PostgreSQL database)
- **Git**

### 2. Environment Setup

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/NIKHILGONUGUNTA-STACK/Liora---R2R.git
   cd Liora---R2R
   ```

2. Navigate to the backend directory and set up your environment variables:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Edit the `backend/.env` file with your specific configurations (such as your `GEMINI_API_KEY`).

### 3. Running with Docker Compose

The easiest way to run the foundation is via Docker Compose, which spins up both the PostgreSQL database and the FastAPI backend.

```bash
docker compose up --build -d
```
The API will be available at `http://localhost:8000`. You can check its health at `http://localhost:8000/api/v1/health`.

### 4. Running Locally (Development Mode)

If you prefer to run the FastAPI server directly on your machine while keeping PostgreSQL in Docker:

1. **Start the Database:**
   ```bash
   docker compose up -d db
   ```

2. **Install Dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run Alembic Migrations:**
   Ensure the database is up to date:
   ```bash
   alembic upgrade head
   ```

4. **Start the Backend Server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 5. Running Tests

To verify the foundation is working correctly, run the test suite:

```bash
cd backend
pytest tests/
```

---

## 🔮 Roadmap

- [x] **Layer 1: Engineering Foundation** (FastAPI, PostgreSQL, Tests, Docker)
- [ ] **Layer 2: Data Modeling** (PostgreSQL + pgvector schema, Document Models)
- [ ] **Layer 3: Ingestion Pipeline** (PDF Parsing, Semantic Chunking, Embeddings)
- [ ] **Layer 4: Retrieval Engine** (Hybrid Search, Reranking)
- [ ] **Layer 5: Generation & UI** (Gemini LLM integration, Citations, Web Interface)
