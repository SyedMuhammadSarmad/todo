"""Session model for tracking authenticated user sessions (optional - for audit logging)."""
from sqlmodel import SQLModel, Field
from datetime import datetime, timedelta
from typing import Optional


class Session(SQLModel, table=True):
    """Session table model for audit logging and session management."""

    __tablename__ = "sessions"

    id: str = Field(primary_key=True, max_length=255)
    user_id: str = Field(foreign_key="users.id", index=True, max_length=255)
    token_hash: str = Field(index=True, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(days=7)
    )
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)
    user_agent: Optional[str] = None
    ip_address: Optional[str] = Field(default=None, max_length=45)
