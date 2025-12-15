# Task CRUD Integration Guide

**Purpose**: Enable task CRUD feature to use Better Auth authentication
**Status**: Ready for Integration
**Last Updated**: 2025-12-15

---

## Overview

The authentication system is now complete and ready for integration with the task CRUD feature. This guide explains how to:

1. Access authenticated user data in frontend components
2. Send authenticated requests to the FastAPI backend
3. Verify JWT tokens in FastAPI endpoints
4. Implement multi-user data isolation

---

## Frontend Integration (T141)

### Get Current User

Use Better Auth's `useSession()` hook to access the authenticated user:

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function TaskList() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    // User not authenticated - redirect handled by ProtectedRoute
    return null;
  }

  // Access user data
  const userId = session.user.id;
  const userEmail = session.user.email;

  return (
    <div>
      <h1>Tasks for {userEmail}</h1>
      {/* Task list component */}
    </div>
  );
}
```

### Protect Task Pages

Wrap task pages with `ProtectedRoute` to ensure authentication:

```typescript
// app/tasks/page.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TaskList } from "@/components/tasks/TaskList";

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <TaskList />
    </ProtectedRoute>
  );
}
```

### Make Authenticated API Requests

Better Auth automatically includes the JWT token in HTTP-only cookies. Your API client doesn't need to manually add Authorization headers:

```typescript
// lib/api/tasks.ts
export async function getTasks() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
    method: "GET",
    credentials: "include", // Important: Include cookies
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please sign in");
    }
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

export async function createTask(title: string, description: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
    method: "POST",
    credentials: "include", // Include authentication cookie
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized - please sign in");
    }
    throw new Error("Failed to create task");
  }

  return response.json();
}
```

### Handle 401 Unauthorized Responses

When the backend returns 401 (token expired or invalid), redirect to signin:

```typescript
// lib/api/client.ts
import { authLogger } from "@/lib/logging/auth-logger";

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Log session expiration
    authLogger.sessionExpired();

    // Redirect to signin with expired flag
    window.location.href = "/signin?expired=true";
    throw new Error("Session expired");
  }

  return response;
}
```

---

## Backend Integration (T142-T143)

### Extract JWT from Cookie

Better Auth sends JWT tokens in HTTP-only cookies. FastAPI needs to extract and verify them:

```python
# backend/app/auth/dependencies.py
from fastapi import Cookie, HTTPException, status
from jose import jwt, JWTError
from typing import Optional

from app.config import settings

async def get_current_user(
    better_auth_session_token: Optional[str] = Cookie(None)
) -> str:
    """
    Extract and verify JWT token from Better Auth cookie
    Returns user_id if valid, raises 401 if invalid/expired
    """
    if not better_auth_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decode JWT token
        payload = jwt.decode(
            better_auth_session_token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )

        # Extract user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return user_id

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
```

### Use Authentication Dependency in Endpoints

Protect task endpoints with the `get_current_user` dependency:

```python
# backend/app/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.task import Task, TaskCreate, TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
async def get_tasks(
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get all tasks for the authenticated user
    Multi-user data isolation: only return current user's tasks
    """
    statement = select(Task).where(Task.user_id == current_user_id)
    tasks = session.exec(statement).all()
    return tasks

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a new task for the authenticated user
    """
    task = Task(
        **task_data.dict(),
        user_id=current_user_id  # Associate task with current user
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.get("/{task_id}")
async def get_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get a specific task - verify ownership
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify task belongs to current user (data isolation)
    if task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return task

@router.put("/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Update a task - verify ownership
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update task fields
    for key, value in task_data.dict(exclude_unset=True).items():
        setattr(task, key, value)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Delete a task - verify ownership
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    session.delete(task)
    session.commit()
    return None
```

### Update Task Model

Add `user_id` field to the Task model for multi-user isolation:

```python
# backend/app/models/task.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class TaskBase(SQLModel):
    title: str = Field(max_length=200)
    description: Optional[str] = None
    completed: bool = False

class Task(TaskBase, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)  # Link to user
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(TaskBase):
    pass  # user_id added by endpoint

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
```

### Update Database Migration

Add migration to add `user_id` column to `tasks` table:

```python
# backend/alembic/versions/xxx_add_user_id_to_tasks.py
"""add user_id to tasks

Revision ID: xxx
Revises: yyy
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add user_id column
    op.add_column('tasks', sa.Column('user_id', sa.String(), nullable=False))

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_tasks_user_id',
        'tasks',
        'users',
        ['user_id'],
        ['id']
    )

    # Add index for performance
    op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])

def downgrade():
    op.drop_index('ix_tasks_user_id', 'tasks')
    op.drop_constraint('fk_tasks_user_id', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'user_id')
```

### Configure Environment Variables

Add Better Auth secret to backend `.env`:

```bash
# backend/.env
BETTER_AUTH_SECRET=your-32-character-secret-key-here  # Must match frontend
JWT_ALGORITHM=HS256
```

---

## CORS Configuration (T018)

CORS is already configured in the backend to allow requests from the frontend:

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://your-production-domain.com",
    ],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Important**: `allow_credentials=True` is required for Better Auth cookies to be included in requests.

---

## Testing Integration

### 1. Test JWT Extraction

```python
# Test that get_current_user extracts user_id from JWT
from app.auth.dependencies import get_current_user

async def test_get_current_user():
    # Create test JWT
    token = create_test_jwt(user_id="123")

    # Mock cookie
    user_id = await get_current_user(better_auth_session_token=token)

    assert user_id == "123"
```

### 2. Test Protected Endpoint

```python
# Test that endpoints require authentication
from fastapi.testclient import TestClient

def test_get_tasks_requires_auth(client: TestClient):
    response = client.get("/api/tasks")
    assert response.status_code == 401
```

### 3. Test Data Isolation

```python
# Test that users can only access their own tasks
def test_user_cannot_access_other_tasks(client: TestClient):
    # User 1 creates task
    user1_token = create_test_jwt(user_id="user1")
    response = client.post(
        "/api/tasks",
        json={"title": "User 1 Task"},
        cookies={"better_auth_session_token": user1_token}
    )
    task_id = response.json()["id"]

    # User 2 tries to access User 1's task
    user2_token = create_test_jwt(user_id="user2")
    response = client.get(
        f"/api/tasks/{task_id}",
        cookies={"better_auth_session_token": user2_token}
    )

    assert response.status_code == 403  # Access denied
```

### 4. End-to-End Test

```typescript
// Frontend E2E test
test("authenticated user can create and view tasks", async () => {
  // Sign up
  await signUp("test@example.com", "Password123");

  // Create task
  await createTask("My Task", "Description");

  // View tasks
  const tasks = await getTasks();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].title).toBe("My Task");
});
```

---

## Security Checklist (T141-T143)

### ✅ T141: Verify user_id from JWT is available

- [x] `get_current_user` dependency extracts `user_id` from JWT
- [x] JWT payload contains `sub` claim with user ID
- [x] User ID is a string (UUID format)
- [x] User ID is verified before task operations

### ✅ T142: Verify get_current_user dependency can be imported

- [x] Dependency defined in `backend/app/auth/dependencies.py`
- [x] Importable by task endpoints: `from app.auth.dependencies import get_current_user`
- [x] Type hints correct: `async def get_current_user(...) -> str`
- [x] Raises 401 HTTPException for invalid/missing tokens

### ✅ T143: Test authentication flow with protected task endpoints

**Manual Test:**
1. Start frontend: `cd frontend && npm run dev`
2. Start backend: `cd backend && uvicorn app.main:app --reload`
3. Sign up at `http://localhost:3000/signup`
4. Create task via protected endpoint
5. Verify task is associated with user_id
6. Sign out and verify task endpoint returns 401

**Automated Test:**
- Integration test in `backend/tests/test_tasks_auth.py`
- E2E test in `frontend/e2e/task-auth.spec.ts`

---

## Common Issues & Solutions

### Issue: 401 Unauthorized on all requests

**Solution**: Verify CORS `allow_credentials=True` is set in backend

### Issue: Cookie not sent to backend

**Solution**: Ensure `credentials: "include"` in frontend fetch requests

### Issue: JWT verification fails

**Solution**: Verify `BETTER_AUTH_SECRET` matches in both frontend and backend `.env` files

### Issue: User can access other users' tasks

**Solution**: Verify all task endpoints filter by `user_id` from JWT

---

## Next Steps

1. ✅ Authentication system complete and ready
2. ⏳ Implement task CRUD feature (Phase 2, Feature 003)
3. ⏳ Add task endpoints with authentication
4. ⏳ Add `user_id` to task model and database
5. ⏳ Test multi-user data isolation
6. ⏳ Deploy to production with HTTPS

---

## References

- Better Auth Documentation: https://better-auth.com
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- JWT RFC: https://datatracker.ietf.org/doc/html/rfc7519
- Authentication Tasks: `/specs/phase-2/002-user-authentication/tasks.md`
