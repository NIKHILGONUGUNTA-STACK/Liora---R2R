"""Migrate vector to 1024

Revision ID: a1b2c3d4e5f6
Revises: 3d59532f544f
Create Date: 2026-10-06 10:54:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3d59532f544f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Drop the existing HNSW index
    op.drop_index('ix_document_chunks_embedding_hnsw', table_name='document_chunks', 
                  postgresql_using='hnsw', 
                  postgresql_with={'m': 16, 'ef_construction': 64}, 
                  postgresql_ops={'embedding': 'vector_cosine_ops'})
    
    # 2. Set all existing embeddings to NULL because 384D is invalid in 1024D space
    op.execute("UPDATE document_chunks SET embedding = NULL")
    
    # 3. Alter the column type to Vector(1024)
    # Since all rows are NULL, we can cast or just alter type.
    op.execute("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(1024)")
    
    # 4. Recreate the index
    op.create_index('ix_document_chunks_embedding_hnsw', 'document_chunks', ['embedding'], 
                    unique=False, 
                    postgresql_using='hnsw', 
                    postgresql_with={'m': 16, 'ef_construction': 64}, 
                    postgresql_ops={'embedding': 'vector_cosine_ops'})

def downgrade() -> None:
    # Reverse operations
    op.drop_index('ix_document_chunks_embedding_hnsw', table_name='document_chunks', 
                  postgresql_using='hnsw', 
                  postgresql_with={'m': 16, 'ef_construction': 64}, 
                  postgresql_ops={'embedding': 'vector_cosine_ops'})
    
    op.execute("UPDATE document_chunks SET embedding = NULL")
    op.execute("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(384)")
    
    op.create_index('ix_document_chunks_embedding_hnsw', 'document_chunks', ['embedding'], 
                    unique=False, 
                    postgresql_using='hnsw', 
                    postgresql_with={'m': 16, 'ef_construction': 64}, 
                    postgresql_ops={'embedding': 'vector_cosine_ops'})
