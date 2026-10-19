from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
import random
import time
import urllib.parse
import uuid
import re
import httpx
from app.core.config import settings
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    SendOTPRequest,
    VerifyOTPRequest,
    OTPResponse,
)
from app.services.auth import verify_password, get_password_hash, create_access_token
from app.services.email import EmailService
from app.api.deps import get_current_user
from app.core.logging import AuditLogger

router = APIRouter()

def validate_password_complexity(password: str) -> None:
    """
    Enforces production password policy:
    - Minimum 8 characters
    - At least one letter
    - At least one digit (0-9)
    - At least one special character
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r'[A-Za-z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter."
        )
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit (0-9)."
        )
    if not re.search(r'[^A-Za-z0-9]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%^&* etc.)."
        )

# In-memory OTP store for email verification
OTP_STORE: dict[str, dict] = {}

@router.post("/send-otp", response_model=OTPResponse)
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()

    # Pre-verification: Prevent sending OTP if email already has an active account
    if req.purpose == "create":
        try:
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                AuditLogger.log("OTP_BLOCKED_EXISTING_USER", details={"email": email})
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists. Please sign in."
                )
        except HTTPException:
            raise
        except Exception as e:
            AuditLogger.log("DB_CHECK_FAILED_SEND_OTP", details={"email": email, "error": str(e)})

    code = f"{random.randint(100000, 999999)}"
    OTP_STORE[email] = {
        "code": code,
        "expires_at": time.time() + 600, # 10 minutes
    }
    AuditLogger.log("OTP_SENT", details={"email": email, "purpose": req.purpose})
    EmailService.send_otp_email(email, code, purpose=req.purpose or "create")
    return OTPResponse(
        message="Verification code sent to your email.",
        resend_cooldown_seconds=120,
    )

@router.post("/verify-otp", response_model=Token)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = req.email.lower()
    record = OTP_STORE.get(email)
    
    is_valid = False
    if record and record["code"] == req.otp and record["expires_at"] > time.time():
        is_valid = True

    if not is_valid:
        AuditLogger.log("OTP_VERIFICATION_FAILURE", details={"email": email})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    if req.password:
        validate_password_complexity(req.password)

    # Clean OTP from store after successful use
    if email in OTP_STORE:
        del OTP_STORE[email]

    user_id = None
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            password = req.password or "LioraSecurePass2026!"
            hashed_password = get_password_hash(password)
            user = User(
                email=email,
                password_hash=hashed_password,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            AuditLogger.log("USER_REGISTERED_VIA_OTP", user_id=str(user.id))
        else:
            if req.password:
                user.password_hash = get_password_hash(req.password)
            if not user.is_active:
                user.is_active = True
            db.commit()
            AuditLogger.log("PASSWORD_UPDATED_VIA_OTP", user_id=str(user.id))
        user_id = str(user.id)
    except OperationalError as db_err:
        db.rollback()
        AuditLogger.log("DB_OFFLINE_ERROR", details={"email": email, "error": str(db_err)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry in a few moments."
        )

    access_token = create_access_token(data={"sub": user_id, "email": email.lower()})
    AuditLogger.log("LOGIN_SUCCESS_VIA_OTP", user_id=user_id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/reset-password", response_model=Token)
def reset_password(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Dedicated endpoint to reset user password using verified OTP code.
    Enforces min 8 characters, letters, digits, and special characters.
    """
    if not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A new password is required."
        )
    validate_password_complexity(req.password)
    return verify_otp(req, db)

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    try:
        user = db.query(User).filter(User.email == email_clean).first()
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry."
        )
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    
    validate_password_complexity(user_in.password)
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=email_clean,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_clean = form_data.username.strip().lower()
    user = None
    try:
        user = db.query(User).filter(User.email == email_clean).first()
    except OperationalError as e:
        AuditLogger.log("DB_OFFLINE_LOGIN_ATTEMPT", details={"email": email_clean, "error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry in a moment."
        )

    if not user:
        AuditLogger.log("LOGIN_FAILURE", details={"email": email_clean, "reason": "user_not_found"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        AuditLogger.log("LOGIN_FAILURE", details={"email": email_clean, "reason": "invalid_password"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        AuditLogger.log("LOGIN_FAILURE", user_id=str(user.id), details={"reason": "inactive"})
        raise HTTPException(status_code=400, detail="Inactive user")

    user_id = str(user.id)
    access_token = create_access_token(data={"sub": user_id, "email": user.email.lower()})
    AuditLogger.log("LOGIN_SUCCESS", user_id=user_id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==========================================
# Google OAuth 2.0
# ==========================================
@router.get("/google/login")
def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env."
        )
    redirect_uri = f"{request.base_url}api/v1/auth/google/callback"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="Google OAuth credentials missing.")
    
    redirect_uri = f"{request.base_url}api/v1/auth/google/callback"
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=data)
        if token_resp.status_code != 200:
            AuditLogger.log("GOOGLE_OAUTH_TOKEN_FAILED")
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code with Google.")
        
        token_data = token_resp.json()
        google_access_token = token_data.get("access_token")
        
        user_info_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"}
        )
        if user_info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve user profile from Google.")
        
        user_info = user_info_resp.json()
        email = user_info.get("email", "").lower()
        name = user_info.get("name") or email.split("@")[0]

    if not email:
        raise HTTPException(status_code=400, detail="No email associated with this Google account.")

    user_id = None
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash(f"google_oauth_{email}_{int(time.time())}"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            AuditLogger.log("USER_REGISTERED_VIA_GOOGLE_OAUTH", user_id=str(user.id))
        else:
            if not user.is_active:
                user.is_active = True
                db.commit()
        user_id = str(user.id)
    except OperationalError as db_err:
        db.rollback()
        AuditLogger.log("DB_OFFLINE_SESSION_FAILED", details={"email": email, "error": str(db_err), "provider": "google"})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry in a moment."
        )

    jwt_token = create_access_token(data={"sub": user_id, "email": email.lower()})
    AuditLogger.log("LOGIN_SUCCESS_VIA_GOOGLE_OAUTH", user_id=user_id)

    frontend_redirect = f"{settings.FRONTEND_URL}/signin?token={jwt_token}&email={urllib.parse.quote(email)}&name={urllib.parse.quote(name)}&provider=google"
    return RedirectResponse(url=frontend_redirect)

# ==========================================
# GitHub OAuth 2.0
# ==========================================
@router.get("/github/login")
def github_login(request: Request):
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="GitHub OAuth is not configured yet. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env."
        )
    redirect_uri = f"{request.base_url}api/v1/auth/github/callback"
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "user:email",
    }
    auth_url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url)

@router.get("/github/callback")
async def github_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="GitHub OAuth credentials missing.")
    
    redirect_uri = f"{request.base_url}api/v1/auth/github/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"}
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code with GitHub.")
        
        token_data = token_resp.json()
        github_token = token_data.get("access_token")
        if not github_token:
            raise HTTPException(status_code=400, detail="GitHub authorization token missing.")
        
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}", "User-Agent": "Liora-Engine"}
        )
        user_profile = user_resp.json() if user_resp.status_code == 200 else {}
        name = user_profile.get("name") or user_profile.get("login") or "Developer"
        email = user_profile.get("email")

        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {github_token}", "User-Agent": "Liora-Engine"}
            )
            if emails_resp.status_code == 200:
                emails_list = emails_resp.json()
                for item in emails_list:
                    if item.get("primary") and item.get("verified"):
                        email = item.get("email")
                        break
                if not email and emails_list:
                    email = emails_list[0].get("email")

    if not email:
        raise HTTPException(status_code=400, detail="No verified email found on this GitHub account.")

    email = email.lower()
    user_id = None
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash(f"github_oauth_{email}_{int(time.time())}"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            AuditLogger.log("USER_REGISTERED_VIA_GITHUB_OAUTH", user_id=str(user.id))
        else:
            if not user.is_active:
                user.is_active = True
                db.commit()
        user_id = str(user.id)
    except OperationalError as db_err:
        db.rollback()
        AuditLogger.log("DB_OFFLINE_SESSION_FAILED", details={"email": email, "error": str(db_err), "provider": "github"})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Please retry in a moment."
        )

    jwt_token = create_access_token(data={"sub": user_id, "email": email.lower()})
    AuditLogger.log("LOGIN_SUCCESS_VIA_GITHUB_OAUTH", user_id=user_id)

    frontend_redirect = f"{settings.FRONTEND_URL}/signin?token={jwt_token}&email={urllib.parse.quote(email)}&name={urllib.parse.quote(name)}&provider=github"
    return RedirectResponse(url=frontend_redirect)
