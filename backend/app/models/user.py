"""User model for authentication."""
from sqlmodel import SQLModel, Field
from pydantic import field_validator, EmailStr
from datetime import datetime
from typing import Optional
import re


class User(SQLModel, table=True):
    """User table model with authentication fields."""

    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=255)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_signin_at: Optional[datetime] = None
    name: Optional[str] = Field(default=None, max_length=255)
    email_verified: bool = Field(default=False)
    image: Optional[str] = Field(default=None, max_length=255)


class UserCreate(SQLModel):
    """Schema for creating a new user (signup request)."""

    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """Validate password has at least one letter and one number."""
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserRead(SQLModel):
    """Schema for reading user data (never includes password_hash)."""

    id: str
    email: str
    created_at: datetime
    updated_at: datetime
    last_signin_at: Optional[datetime] = None
    name: Optional[str] = None
    email_verified: bool = False # Ensure this is compatible with better-auth's default
    image: Optional[str] = None


class SigninRequest(SQLModel):
    """Schema for signin request."""

    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=1)


class AuthResponse(SQLModel):
    """Schema for authentication response with user and token."""

    user: UserRead
    token: str
    expires_at: datetime
