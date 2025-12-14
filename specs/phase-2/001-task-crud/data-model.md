# Data Model: Task Entity

**Feature**: Task CRUD Operations
**Branch**: `001-task-crud`
**Date**: 2025-12-14
**Database**: Neon Serverless PostgreSQL

## Overview

The Task entity represents a user's todo item in the multi-user task management system. Each task belongs to exactly one user (1:N relationship) and contains a title, optional description, completion status, and timestamps for auditing.

## Entity Relationship

```
┌─────────────┐           ┌─────────────┐
│    User     │           │    Task     │
├─────────────┤           ├─────────────┤
│ id (PK)     │◄──────────┤ id (PK)     │
│ email       │    1:N    │ user_id (FK)│
│ name        │           │ title       │
│ created_at  │           │ description │
│             │           │ completed   │
│             │           │ created_at  │
│             │           │ updated_at  │
└─────────────┘           └─────────────┘

Relationship: One User → Many Tasks
Cascade: ON DELETE CASCADE (when user deleted, all tasks deleted)
```

## Database Schema

### Table: `tasks`

| Column       | Type                  | Constraints                                    | Description                          |
|--------------|-----------------------|------------------------------------------------|--------------------------------------|
| `id`         | `SERIAL`              | `PRIMARY KEY`                                  | Auto-incrementing task identifier    |
| `user_id`    | `INTEGER`             | `NOT NULL`, `FOREIGN KEY users(id) ON DELETE CASCADE` | Owner of the task          |
| `title`      | `VARCHAR(200)`        | `NOT NULL`                                     | Task title (1-200 characters)        |
| `description`| `TEXT`                | `NULL`                                         | Optional description (max 1000 chars)|
| `completed`  | `BOOLEAN`             | `NOT NULL DEFAULT FALSE`                       | Task completion status               |
| `created_at` | `TIMESTAMP`           | `NOT NULL DEFAULT CURRENT_TIMESTAMP`           | When task was created                |
| `updated_at` | `TIMESTAMP`           | `NOT NULL DEFAULT CURRENT_TIMESTAMP`           | Last modification timestamp          |

### Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX tasks_pkey ON tasks(id);

-- Foreign key index for user_id lookups (required for all queries)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Composite index for default task list ordering (user + newest first)
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
```

**Index Rationale**:
- `idx_tasks_user_id`: Optimizes all queries that filter by user (every task query)
- `idx_tasks_user_created`: Optimizes task list view sorted by creation date (most common query)
- Both indexes support efficient queries for up to 500 tasks per user (SC-006)

### Constraints

```sql
-- Foreign key constraint with cascade delete
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Title length validation (enforced at application level via Pydantic)
-- Description length validation (enforced at application level via Pydantic)
```

### SQL DDL

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);

-- Trigger to auto-update updated_at timestamp
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
```

## SQLModel Definition (Python Backend)

### Base Model

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class TaskBase(SQLModel):
    """Shared fields for Task entity (used in create/update schemas)"""
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
```

### Table Model

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User

class Task(TaskBase, table=True):
    """Task table model with all database fields"""
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship (optional, for ORM navigation)
    user: Optional["User"] = Relationship(back_populates="tasks")
```

### API Schemas

```python
class TaskCreate(TaskBase):
    """Schema for creating a new task (no id, user_id, or timestamps)"""
    pass


class TaskUpdate(SQLModel):
    """Schema for updating a task (all fields optional)"""
    title: Optional[str] = Field(default=None, max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None


class TaskRead(TaskBase):
    """Schema for reading a task (includes all fields)"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
```

### Example Usage

```python
from sqlmodel import Session, select
from datetime import datetime

# Create a new task
new_task = Task(
    user_id=1,
    title="Buy groceries",
    description="Milk, eggs, bread",
    completed=False
)
session.add(new_task)
session.commit()
session.refresh(new_task)  # Get auto-generated id

# Query tasks for a user
statement = select(Task).where(Task.user_id == 1).order_by(Task.created_at.desc())
tasks = session.exec(statement).all()

# Update task completion status
task = session.get(Task, task_id)
if task:
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()

# Delete a task
task = session.get(Task, task_id)
if task and task.user_id == current_user_id:
    session.delete(task)
    session.commit()
```

## TypeScript Interface (Frontend)

### Type Definitions

```typescript
// types/task.ts

/**
 * Task entity matching backend SQLModel
 */
export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
}

/**
 * Schema for creating a new task (POST request body)
 */
export interface TaskCreate {
  title: string; // 1-200 characters
  description?: string; // Optional, max 1000 characters
  completed?: boolean; // Optional, defaults to false
}

/**
 * Schema for updating a task (PUT request body)
 */
export interface TaskUpdate {
  title?: string; // Optional, 1-200 characters
  description?: string; // Optional, max 1000 characters
  completed?: boolean; // Optional
}

/**
 * Task status filter options
 */
export type TaskStatus = 'all' | 'pending' | 'completed';

/**
 * API response for task list
 */
export interface TaskListResponse {
  tasks: Task[];
  total: number;
}
```

### Zod Validation Schemas

```typescript
// lib/validations/task.ts
import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  completed: z.boolean().default(false),
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  completed: z.boolean().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
```

### Example Frontend Usage

```typescript
import { Task, TaskCreate } from '@/types/task';
import { taskCreateSchema } from '@/lib/validations/task';

// Create a new task
const newTaskData: TaskCreate = {
  title: "Buy groceries",
  description: "Milk, eggs, bread",
  completed: false,
};

// Validate with Zod
const validatedData = taskCreateSchema.parse(newTaskData);

// API call (using fetch or axios)
const response = await fetch(`/api/${userId}/tasks`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(validatedData),
});

const createdTask: Task = await response.json();

// Display task
console.log(`Task #${createdTask.id}: ${createdTask.title}`);
console.log(`Created: ${new Date(createdTask.created_at).toLocaleDateString()}`);
```

## Data Validation Rules

### Backend (SQLModel/Pydantic)
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters
- `completed`: Boolean, defaults to `False`
- `user_id`: Required, must reference valid user
- `created_at`: Auto-generated, read-only
- `updated_at`: Auto-generated, auto-updated on changes

### Frontend (Zod)
- `title`: Required, 1-200 characters, trimmed whitespace
- `description`: Optional, max 1000 characters, trimmed whitespace
- `completed`: Boolean, defaults to `false`

### Business Rules
1. **User Isolation**: Tasks MUST only be accessible to the owning user
2. **Referential Integrity**: user_id MUST reference an existing user
3. **Cascade Delete**: When a user is deleted, all their tasks are deleted
4. **Audit Trail**: created_at and updated_at provide task history
5. **Status Toggle**: completed can be toggled between true/false
6. **No Orphans**: Tasks cannot exist without a user (enforced by FK constraint)

## Migration Strategy

### Initial Migration (Phase 2 Setup)

```python
# alembic/versions/001_create_tasks_table.py
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

## Performance Considerations

### Query Optimization
- All queries include `WHERE user_id = ?` filter (indexed)
- Default ordering by `created_at DESC` uses composite index
- No N+1 queries (avoid loading user for each task unless needed)

### Scaling Limits
- Supports 500 tasks per user without performance degradation (SC-006)
- Integer ID remains efficient up to millions of tasks
- Indexes ensure <100ms query time for typical task lists

### Future Optimizations (Phase 3+)
- Add pagination if users exceed 500 tasks
- Consider caching frequent queries (Redis)
- Implement soft delete (add `deleted_at` column) for recovery

---

**Status**: Complete - Ready for implementation
**Next Step**: Review contracts/task-api.md for API integration
**Dependencies**: User model must exist before creating tasks table
