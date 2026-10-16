from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "create"  # "create" or "reset"

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None

class OTPResponse(BaseModel):
    message: str
    resend_cooldown_seconds: int = 120

