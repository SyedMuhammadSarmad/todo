# Backend Guidelines - FastAPI + SQLModel

**Framework**: FastAPI
**Language**: Python 3.13+
**ORM**: SQLModel
**Database**: Neon Serverless PostgreSQL
**Package Manager**: UV

## Stack Overview

| Technology | Purpose |
|------------|---------|
| FastAPI | High-performance API framework |
| SQLModel | Type-safe ORM (SQLAlchemy + Pydantic) |
| Neon PostgreSQL | Serverless database |
| UV | Fast Python package manager |
| Pydantic | Data validation |
| Python-Jose | JWT handling |

## Project Structure (To Be Created)

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py               # Settings and configuration
├── db.py                   # Database connection and session
│
├── models/                 # SQLModel database models
│   ├── __init__.py
│   ├── user.py             # User model (Better Auth integration)
│   └── task.py             # Task model
│
├── routes/                 # API route handlers
│   ├── __init__.py
│   ├── auth.py             # Authentication endpoints
│   └── tasks.py            # Task CRUD endpoints
│
├── middleware/             # FastAPI middleware
│   ├── __init__.py
│   ├── jwt_auth.py         # JWT verification middleware
│   └── cors.py             # CORS configuration
│
├── schemas/                # Pydantic request/response schemas
│   ├── __init__.py
│   ├── task.py             # Task DTOs
│   └── user.py             # User DTOs
│
├── .env                    # Environment variables (git-ignored)
├── pyproject.toml          # UV project configuration
├── uv.lock                 # Dependency lock file
└── CLAUDE.md               # This file
```

## Development Patterns

### 1. FastAPI App Structure

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import tasks, auth
from db import init_db

app = FastAPI(
    title="Todo API",
    description="Multi-user task management API",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def read_root():
    return {"message": "Todo API v2.0", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

### 2. Database Models with SQLModel

```python
# models/task.py
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    """Task model for database"""
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = None
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    # user: Optional["User"] = Relationship(back_populates="tasks")
```

```python
# models/user.py
from sqlmodel import Field, SQLModel
from typing import Optional

class User(SQLModel, table=True):
    """User model - managed by Better Auth"""
    __tablename__ = "users"

    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3. Database Connection

```python
# db.py
from sqlmodel import SQLModel, create_engine, Session
from config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Verify connections before using
)

def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for database sessions"""
    with Session(engine) as session:
        yield session
```

### 4. Configuration Management

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Authentication
    BETTER_AUTH_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Application
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### 5. API Routes with Type Safety

```python
# routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from models.task import Task
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from db import get_session
from middleware.jwt_auth import get_current_user

router = APIRouter()

@router.get("/{user_id}/tasks", response_model=list[TaskResponse])
async def get_tasks(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    status: str = "all",  # Query parameter
):
    """Get all tasks for authenticated user"""
    # Verify user_id matches authenticated user
    if user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another user's tasks"
        )

    # Build query
    statement = select(Task).where(Task.user_id == user_id)

    if status == "pending":
        statement = statement.where(Task.completed == False)
    elif status == "completed":
        statement = statement.where(Task.completed == True)

    tasks = session.exec(statement).all()
    return tasks

@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Create a new task"""
    # Verify user_id
    if user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create tasks for another user"
        )

    # Create task
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task

@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Update an existing task"""
    # Verify user and get task
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != user_id or user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )

    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task

@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    user_id: str,
    task_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Delete a task"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != user_id or user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task"
        )

    session.delete(task)
    session.commit()

    return None

@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def toggle_complete(
    user_id: str,
    task_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Toggle task completion status"""
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task.user_id != user_id or user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )

    task.completed = not task.completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task
```

### 6. Request/Response Schemas

```python
# schemas/task.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    """Schema for creating a task"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    """Schema for task responses"""
    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLModel objects
```

### 7. JWT Authentication Middleware

```python
# middleware/jwt_auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    """Verify JWT token and return user data"""
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {"id": user_id, **payload}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

### 8. Error Handling

```python
# Standard error responses
from fastapi import HTTPException, status

# 400 Bad Request
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid request data"
)

# 401 Unauthorized
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)

# 403 Forbidden
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Not authorized to access this resource"
)

# 404 Not Found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)

# 500 Internal Server Error (handled by FastAPI automatically)
```

## Environment Variables

Create `.env` (DO NOT commit to git):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication (MUST match frontend)
BETTER_AUTH_SECRET=your-shared-secret-min-32-chars-same-as-frontend
JWT_ALGORITHM=HS256

# CORS (Frontend URL)
CORS_ORIGINS=["http://localhost:3000"]

# Debug
DEBUG=true
```

## Naming Conventions

- **Files**: snake_case (e.g., `task.py`, `jwt_auth.py`)
- **Classes**: PascalCase (e.g., `Task`, `TaskCreate`)
- **Functions**: snake_case (e.g., `get_tasks`, `create_task`)
- **Constants**: UPPER_CASE (e.g., `DATABASE_URL`)

## Common Pitfalls to Avoid

❌ **Don't**: Skip user verification in protected endpoints
❌ **Don't**: Return database models directly (use Pydantic schemas)
❌ **Don't**: Hardcode secrets or connection strings
❌ **Don't**: Forget to close database sessions
❌ **Don't**: Allow users to access other users' data

✅ **Do**: Always verify user_id matches JWT user
✅ **Do**: Use Pydantic schemas for request/response
✅ **Do**: Store all secrets in `.env`
✅ **Do**: Use FastAPI's dependency injection
✅ **Do**: Enforce user isolation at query level

## Development Commands

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Opens on http://localhost:8000

# Access API docs
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc

# Run tests
uv run pytest

# Type checking
uv run mypy .

# Format code
uv run black .
uv run isort .
```

## API Documentation

FastAPI auto-generates OpenAPI documentation:
- **Swagger UI**: http://localhost:8000/docs (interactive)
- **ReDoc**: http://localhost:8000/redoc (readable)
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Testing (To Be Added)

- **Unit Tests**: pytest + httpx
- **Integration Tests**: TestClient (FastAPI built-in)
- **Database Tests**: In-memory SQLite or test database

## References

- FastAPI Docs: https://fastapi.tiangolo.com
- SQLModel Docs: https://sqlmodel.tiangolo.com
- Pydantic Docs: https://docs.pydantic.dev
- Python-Jose: https://python-jose.readthedocs.io

---

**Before implementing**, always check:
1. ✅ Read relevant spec from `specs/phase-2/api/` or `specs/phase-2/database/`
2. ✅ Follow patterns in this CLAUDE.md
3. ✅ Always verify user_id matches authenticated user
4. ✅ Use Pydantic schemas for all request/response
5. ✅ Filter all queries by user_id for multi-user isolation
