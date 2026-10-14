import pytest
import uuid
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models.user import User
from app.services.auth import create_access_token

@pytest.fixture(scope="function")
def global_db():
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

@pytest.fixture(scope="function")
def test_user(global_db: Session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"global_{user_id}@example.com",
        password_hash="fakehash",
        is_active=True
    )
    global_db.add(user)
    global_db.commit()
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}
