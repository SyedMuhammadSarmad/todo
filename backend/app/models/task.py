"""
Task model for todo application
Implements CRUD operations with user isolation
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User


class TaskStatus(str, Enum):
    """Task status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"


class TaskBase(SQLModel):
    """Base task model with shared fields"""
    title: str = Field(min_length=1, max_length=200, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)


class Task(TaskBase, table=True):
    """
    Task database model

    Relationships:
    - Belongs to one User (many-to-one)

    Security:
    - user_id ensures multi-user data isolation
    - All queries MUST filter by user_id
    """
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship to User (many-to-one)
    user: Optional["User"] = Relationship(back_populates="tasks")


class TaskCreate(SQLModel):
    """Schema for creating a new task"""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class TaskUpdate(SQLModel):
    """Schema for updating an existing task (all fields optional)"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None


class TaskRead(TaskBase):
    """Schema for reading a task (includes computed fields)"""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(SQLModel):
    """Schema for paginated task list response"""
    tasks: list[TaskRead]
    total: int
