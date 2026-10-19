from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import time
import uuid
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.db.database import get_db
from app.db.models.user import User, UserRole
from app.core.config import settings
from app.services.auth import get_password_hash
from app.core.logging import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not settings.AUTH_ENABLED:
        try:
            admin = db.query(User).filter(User.email == "system_admin@liora.test").first()
            if not admin:
                raise HTTPException(status_code=401, detail="Auth disabled but system admin not found")
            return admin
        except OperationalError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service temporarily unavailable"
            )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = {}
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id and not email:
        raise credentials_exception

    user = None
    user_uuid = None
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) and len(user_id) == 36 else None
        except Exception:
            user_uuid = None

    try:
        # 1. Lookup by UUID
        if user_uuid:
            user = db.query(User).filter(User.id == user_uuid).first()

        # 2. Fallback lookup by email
        if user is None and email:
            user = db.query(User).filter(User.email == email.lower()).first()

        # 3. If token is cryptographically valid with email, auto-sync user record to PostgreSQL
        if user is None and email:
            logger.info(f"Auto-provisioning user from verified token: {email}")
            user = User(
                id=user_uuid if user_uuid else uuid.uuid4(),
                email=email.lower(),
                password_hash=get_password_hash(f"liora_sync_{email}_{int(time.time())}"),
                is_active=True,
                role=UserRole.USER.value
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    except OperationalError as oe:
        logger.error(f"Database connection error in get_current_user: {oe}")
        # Return 503 Service Unavailable, NEVER 401!
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry in a moment."
        )
    except SQLAlchemyError as se:
        db.rollback()
        logger.error(f"SQLAlchemy error in get_current_user: {se}")
        user = None

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
        
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user
