from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.user import User, UserRole
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not settings.AUTH_ENABLED:
        # Development fallback if auth is disabled (though usually we enable it for testing)
        admin = db.query(User).filter(User.email == "system_admin@liora.test").first()
        if not admin:
            raise HTTPException(status_code=401, detail="Auth disabled but system admin not found")
        return admin

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = {}
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=["HS256"])
    except Exception:
        raise credentials_exception

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id and not email:
        raise credentials_exception

    user = None
    import uuid
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) and len(user_id) == 36 else None
            if user_uuid:
                user = db.query(User).filter(User.id == user_uuid).first()
        except Exception:
            pass

    if user is None and email:
        user = db.query(User).filter(User.email == email).first()

    if user is None and (user_id or email):
        # Valid JWT signed by AUTH_SECRET_KEY, provision user record if missing
        user_email = email or f"user_{str(user_id)[:8]}@liora.io"
        new_id = uuid.UUID(user_id) if isinstance(user_id, str) and len(user_id) == 36 else uuid.uuid4()
        user = User(
            id=new_id,
            email=user_email,
            first_name=payload.get("firstName") or "User",
            last_name=payload.get("lastName") or "",
            role=UserRole.USER.value,
            password_hash="oauth_or_jwt_session",
            is_active=True
        )
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            user = db.query(User).filter(User.email == user_email).first()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
        
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user
