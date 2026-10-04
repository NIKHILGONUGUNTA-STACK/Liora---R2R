import os
from pathlib import Path

BASE_DIR = Path('C:/Users/nikhi/Liora_R2R/backend')

directories = [
    "app/api/routes",
    "app/core",
    "app/db/models",
    "app/schemas",
    "app/services",
    "app/providers",
    "app/rag/ingestion",
    "app/rag/embeddings",
    "app/rag/retrieval",
    "app/rag/generation",
    "tests",
]

for d in directories:
    (BASE_DIR / d).mkdir(parents=True, exist_ok=True)
    init_file = (BASE_DIR / d / "__init__.py")
    init_file.touch(exist_ok=True)

# Also touch parent inits
(BASE_DIR / "app/__init__.py").touch(exist_ok=True)
(BASE_DIR / "app/api/__init__.py").touch(exist_ok=True)
(BASE_DIR / "app/db/__init__.py").touch(exist_ok=True)
(BASE_DIR / "app/rag/__init__.py").touch(exist_ok=True)

print("Scaffold complete.")
