# Quickstart Guide: Task CRUD Implementation

**Feature**: Task CRUD Operations
**Branch**: `001-task-crud`
**Date**: 2025-12-14
**Estimated Time**: 4-6 hours

## Overview

This guide provides a step-by-step walkthrough for implementing task CRUD operations in the multi-user todo application. Follow these steps sequentially for a smooth implementation experience.

## Prerequisites

Before starting, ensure you have:

- [x] Neon PostgreSQL database instance configured
- [x] JWT authentication middleware implemented (from 002-user-authentication)
- [x] Better Auth configured (from 002-user-authentication)
- [x] User model/table exists with `id`, `email`, `name` fields
- [x] Python 3.13+ with UV package manager
- [x] Node.js 18+ with npm/pnpm
- [x] Next.js 15+ project initialized
- [x] FastAPI project initialized

## Implementation Steps

### Step 1: Backend - Create Task Model (15 minutes)

**Location**: `backend/app/models/task.py`

Create the SQLModel definition for the Task entity:

```python
# backend/app/models/task.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User


class TaskBase(SQLModel):
    """Shared fields for Task entity"""
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)


class Task(TaskBase, table=True):
    """Task table model"""
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    user: Optional["User"] = Relationship(back_populates="tasks")


class TaskCreate(TaskBase):
    """Schema for creating a task"""
    pass


class TaskUpdate(SQLModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(default=None, max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None


class TaskRead(TaskBase):
    """Schema for reading a task"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
```

**Update User model** to include relationship:

```python
# backend/app/models/user.py
from sqlmodel import Relationship
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .task import Task

class User(SQLModel, table=True):
    # ... existing fields ...

    # Add relationship
    tasks: List["Task"] = Relationship(back_populates="user")
```

**Verify**: Import the model in Python shell to ensure no syntax errors.

---

### Step 2: Backend - Create Database Migration (15 minutes)

**Location**: `backend/alembic/versions/002_create_tasks_table.py`

Create Alembic migration (or use SQLModel.metadata.create_all() for rapid prototyping):

```python
# backend/alembic/versions/002_create_tasks_table.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP

def upgrade():
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])
    op.create_index('idx_tasks_user_created', 'tasks', ['user_id', sa.text('created_at DESC')])

    # Trigger for auto-updating updated_at
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)

def downgrade():
    op.drop_index('idx_tasks_user_created', 'tasks')
    op.drop_index('idx_tasks_user_id', 'tasks')
    op.execute('DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')
    op.drop_table('tasks')
```

**Run migration**:

```bash
cd backend
alembic upgrade head
```

**Verify**: Check database to ensure `tasks` table exists with correct schema and indexes.

---

### Step 3: Backend - Implement Task Routes (45 minutes)

**Location**: `backend/app/routers/tasks.py`

Create the FastAPI router with all CRUD endpoints:

```python
# backend/app/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from datetime import datetime
from typing import List, Optional

from ..models.task import Task, TaskCreate, TaskUpdate, TaskRead
from ..models.user import User
from ..dependencies import get_session, get_current_user

router = APIRouter(prefix="/api", tags=["tasks"])


def validate_user_id(url_user_id: int, auth_user_id: int):
    """Ensure user_id in URL matches authenticated user"""
    if url_user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: user_id does not match authenticated user"
        )


def get_task_or_404(session: Session, task_id: int, user_id: int) -> Task:
    """Retrieve task or raise 404 if not found or not owned by user"""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("/{user_id}/tasks", response_model=dict)
async def list_tasks(
    user_id: int,
    status_filter: Optional[str] = Query(default="all", alias="status"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """List all tasks for authenticated user with optional status filter"""
    validate_user_id(user_id, current_user.id)

    # Validate status parameter
    if status_filter not in ["all", "pending", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status parameter. Must be 'all', 'pending', or 'completed'."
        )

    # Build query
    query = select(Task).where(Task.user_id == user_id)

    if status_filter == "pending":
        query = query.where(Task.completed == False)
    elif status_filter == "completed":
        query = query.where(Task.completed == True)

    query = query.order_by(Task.created_at.desc())

    tasks = session.exec(query).all()

    return {"tasks": tasks, "total": len(tasks)}


@router.post("/{user_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    user_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new task for authenticated user"""
    validate_user_id(user_id, current_user.id)

    new_task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed
    )

    session.add(new_task)
    session.commit()
    session.refresh(new_task)

    return new_task


@router.get("/{user_id}/tasks/{task_id}", response_model=TaskRead)
async def get_task(
    user_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific task by ID"""
    validate_user_id(user_id, current_user.id)
    task = get_task_or_404(session, task_id, user_id)
    return task


@router.put("/{user_id}/tasks/{task_id}", response_model=TaskRead)
async def update_task(
    user_id: int,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a task (full replacement)"""
    validate_user_id(user_id, current_user.id)
    task = get_task_or_404(session, task_id, user_id)

    # Update fields (only if provided)
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


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskRead)
async def toggle_task_completion(
    user_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Toggle task completion status"""
    validate_user_id(user_id, current_user.id)
    task = get_task_or_404(session, task_id, user_id)

    task.completed = not task.completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    user_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a task permanently"""
    validate_user_id(user_id, current_user.id)
    task = get_task_or_404(session, task_id, user_id)

    session.delete(task)
    session.commit()

    return None
```

**Verify**: Test endpoints using FastAPI Swagger UI at `http://localhost:8000/docs`.

---

### Step 4: Backend - Register Router (5 minutes)

**Location**: `backend/app/main.py`

Include the task router in the main FastAPI application:

```python
# backend/app/main.py
from fastapi import FastAPI
from .routers import tasks

app = FastAPI(title="Todo API")

# Include routers
app.include_router(tasks.router)

# ... CORS, middleware, etc.
```

**Verify**: Restart FastAPI server and check `/docs` to see task endpoints listed.

---

### Step 5: Frontend - Define TypeScript Types (15 minutes)

**Location**: `frontend/src/types/task.ts`

Create TypeScript interfaces matching backend schemas:

```typescript
// frontend/src/types/task.ts

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}

export type TaskStatus = 'all' | 'pending' | 'completed';

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}
```

**Verify**: Import types in a component to ensure no TypeScript errors.

---

### Step 6: Frontend - Create Zod Validation Schemas (15 minutes)

**Location**: `frontend/src/lib/validations/task.ts`

Define Zod schemas for client-side validation:

```typescript
// frontend/src/lib/validations/task.ts
import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  completed: z.boolean().default(false),
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  completed: z.boolean().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
```

**Verify**: Import schemas in a component to ensure Zod is installed and working.

---

### Step 7: Frontend - Create API Client (30 minutes)

**Location**: `frontend/src/lib/api/tasks.ts`

Create functions to interact with backend API:

```typescript
// frontend/src/lib/api/tasks.ts
import { Task, TaskCreate, TaskUpdate, TaskListResponse, TaskStatus } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token'); // Adjust based on your auth setup

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }

  // Handle 204 No Content (delete response)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getTasks(userId: number, status: TaskStatus = 'all'): Promise<TaskListResponse> {
  const url = `${API_BASE_URL}/api/${userId}/tasks?status=${status}`;
  return fetchWithAuth(url);
}

export async function getTask(userId: number, taskId: number): Promise<Task> {
  const url = `${API_BASE_URL}/api/${userId}/tasks/${taskId}`;
  return fetchWithAuth(url);
}

export async function createTask(userId: number, taskData: TaskCreate): Promise<Task> {
  const url = `${API_BASE_URL}/api/${userId}/tasks`;
  return fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(userId: number, taskId: number, taskData: TaskUpdate): Promise<Task> {
  const url = `${API_BASE_URL}/api/${userId}/tasks/${taskId}`;
  return fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
}

export async function toggleTaskCompletion(userId: number, taskId: number): Promise<Task> {
  const url = `${API_BASE_URL}/api/${userId}/tasks/${taskId}/complete`;
  return fetchWithAuth(url, {
    method: 'PATCH',
  });
}

export async function deleteTask(userId: number, taskId: number): Promise<void> {
  const url = `${API_BASE_URL}/api/${userId}/tasks/${taskId}`;
  return fetchWithAuth(url, {
    method: 'DELETE',
  });
}
```

**Note**: Adjust `localStorage.getItem('auth_token')` based on your actual authentication setup (Better Auth session, cookies, etc.).

**Verify**: Call `getTasks()` in a React component to ensure API communication works.

---

### Step 8: Frontend - Create Task Components (60 minutes)

**Location**: `frontend/src/components/tasks/`

Create reusable task components:

#### TaskList Component

```typescript
// frontend/src/components/tasks/TaskList.tsx
'use client';

import { Task } from '@/types/task';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No tasks yet!</p>
        <p className="text-sm mt-2">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
```

#### TaskItem Component

```typescript
// frontend/src/components/tasks/TaskItem.tsx
'use client';

import { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="mt-1 h-5 w-5"
      />

      <div className="flex-1">
        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Created {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

#### TaskForm Component

```typescript
// frontend/src/components/tasks/TaskForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskCreateSchema, TaskCreateInput } from '@/lib/validations/task';

interface TaskFormProps {
  onSubmit: (data: TaskCreateInput) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<TaskCreateInput>;
  submitLabel?: string;
}

export default function TaskForm({ onSubmit, onCancel, defaultValues, submitLabel = 'Create Task' }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          type="text"
          id="title"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

**Verify**: Import and render components to ensure they display correctly.

---

### Step 9: Frontend - Create Dashboard Page (45 minutes)

**Location**: `frontend/src/app/dashboard/page.tsx`

Create the main task management page:

```typescript
// frontend/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Task, TaskStatus } from '@/types/task';
import { getTasks, createTask, updateTask, toggleTaskCompletion, deleteTask } from '@/lib/api/tasks';
import TaskList from '@/components/tasks/TaskList';
import TaskForm from '@/components/tasks/TaskForm';
import { TaskCreateInput } from '@/lib/validations/task';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const userId = 1; // Replace with actual user ID from auth context

  useEffect(() => {
    loadTasks();
  }, [filter]);

  async function loadTasks() {
    try {
      setIsLoading(true);
      const response = await getTasks(userId, filter);
      setTasks(response.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTask(data: TaskCreateInput) {
    try {
      const newTask = await createTask(userId, data);
      setTasks([newTask, ...tasks]);
      setShowForm(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  }

  async function handleToggleTask(taskId: number) {
    // Optimistic update
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));

    try {
      await toggleTaskCompletion(userId, taskId);
    } catch (error) {
      // Rollback on error
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
      toast.error('Failed to update task');
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteTask(userId, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'completed'] as TaskStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task form */}
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
          <TaskForm onSubmit={handleCreateTask} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="text-center py-12">Loading tasks...</div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onEdit={(task) => setEditingTask(task)}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
```

**Note**: Replace `userId = 1` with actual user ID from your authentication context (Better Auth session).

**Verify**: Navigate to `/dashboard` and test creating, viewing, toggling, and deleting tasks.

---

### Step 10: Testing and Validation (30 minutes)

#### Backend Tests

Create pytest tests for task endpoints:

```python
# backend/tests/test_tasks.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_task(auth_headers):
    response = client.post(
        "/api/1/tasks",
        json={"title": "Test task", "description": "Test description"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["user_id"] == 1

def test_list_tasks(auth_headers):
    response = client.get("/api/1/tasks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert "total" in data

def test_toggle_task_completion(auth_headers, task_id):
    response = client.patch(f"/api/1/tasks/{task_id}/complete", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] == True

def test_delete_task(auth_headers, task_id):
    response = client.delete(f"/api/1/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204
```

Run tests:

```bash
cd backend
pytest tests/test_tasks.py -v
```

#### Frontend Manual Testing

Test each user story:

- [ ] Create a task with title only
- [ ] Create a task with title and description
- [ ] View all tasks
- [ ] Filter by pending tasks
- [ ] Filter by completed tasks
- [ ] Toggle task completion (check optimistic update)
- [ ] Edit a task
- [ ] Delete a task (with confirmation)
- [ ] Test on mobile device (responsive design)
- [ ] Test validation errors (empty title, too long description)

---

## Success Criteria Checklist

Verify all acceptance criteria from spec.md:

### User Story 1 - Create New Task
- [ ] Can create task with 1-200 character title
- [ ] Can add optional description (max 1000 chars)
- [ ] Title required error shows if empty
- [ ] Character limit error shows if exceeded
- [ ] Redirects to task list after creation

### User Story 2 - View All Tasks
- [ ] All tasks display with title, status, creation date
- [ ] Tasks grouped/distinguished by status
- [ ] Mobile-friendly layout on small screens
- [ ] Empty state message when no tasks
- [ ] Can view/expand task descriptions

### User Story 3 - Toggle Completion
- [ ] Can mark pending task as completed
- [ ] Can mark completed task as pending
- [ ] Update happens without page refresh
- [ ] Status persists after page refresh

### User Story 4 - Update Task
- [ ] Edit form pre-filled with current values
- [ ] Can update title and/or description
- [ ] Title required validation works
- [ ] Cancel button discards changes
- [ ] Character limit validation works

### User Story 5 - Delete Task
- [ ] Confirmation dialog appears before delete
- [ ] Task removed after confirmation
- [ ] Task remains if user cancels
- [ ] Success message shows after delete
- [ ] List updates without page refresh

### Performance Criteria
- [ ] SC-001: Task creation completes in < 15 seconds
- [ ] SC-002: Task list loads in < 2 seconds
- [ ] SC-003: Toggle reflects in UI within 500ms
- [ ] SC-006: Handles 500 tasks without degradation
- [ ] SC-007: Validation errors show within 200ms
- [ ] SC-008: Delete completes within 1 second

---

## Common Issues and Solutions

### Issue: CORS errors in browser console

**Solution**: Configure CORS in FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: JWT token not included in requests

**Solution**: Ensure `fetchWithAuth()` retrieves token from correct location (localStorage, cookies, or Better Auth session).

### Issue: Foreign key constraint error when creating task

**Solution**: Ensure user exists in `users` table and `user_id` matches authenticated user.

### Issue: Optimistic updates not working

**Solution**: Check that task state is managed correctly in React component and rollback logic is implemented in catch block.

### Issue: Validation errors not displaying in form

**Solution**: Verify React Hook Form `errors` object is being accessed correctly and error messages are rendered.

---

## Next Steps

After completing implementation:

1. **Review**: Have another developer review the code
2. **Document**: Update README with task management features
3. **Deploy**: Deploy backend and frontend to staging environment
4. **Monitor**: Check logs for any errors or performance issues
5. **Iterate**: Gather user feedback and plan Phase 3 enhancements

### Phase 3 Enhancements (Future)

- Task search and filtering by keywords
- Due dates and reminders
- Task categories/tags
- Bulk operations (select multiple, bulk delete)
- Task prioritization (high/medium/low)
- Pagination for large task lists
- Offline support with service workers
- Undo/redo functionality
- Keyboard shortcuts for power users

---

**Estimated Total Time**: 4-6 hours
**Status**: Ready for implementation
**Dependencies**: JWT auth, User model, Neon PostgreSQL, Better Auth

**Good luck with your implementation!**
