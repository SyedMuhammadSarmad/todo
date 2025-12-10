# Data Model: Todo Console App (Phase 1)

**Date**: 2025-12-10
**Feature**: 001-todo-console-app
**Status**: Complete

## Overview

This document defines the data model for the Phase 1 Todo Console App. The model is designed for in-memory storage with a clear path to database persistence in Phase 2.

## Entities

### Task

The core entity representing a todo item.

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class Task:
    """Represents a single todo task."""

    id: int
    title: str
    description: Optional[str] = None
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)
```

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `int` | Yes | Auto-assigned | Unique identifier, auto-incremented |
| `title` | `str` | Yes | - | Short description of the task (1-200 chars) |
| `description` | `Optional[str]` | No | `None` | Longer details about the task |
| `completed` | `bool` | No | `False` | Whether the task is done |
| `created_at` | `datetime` | No | Now | When the task was created |

#### Validation Rules

| Rule | Field | Constraint | Error |
|------|-------|------------|-------|
| V-001 | `title` | Non-empty string | "Title cannot be empty" |
| V-002 | `title` | Strip whitespace | N/A (auto-applied) |
| V-003 | `id` | Positive integer | System-assigned, not user-provided |

#### State Transitions

```
┌─────────────┐     complete()      ┌─────────────┐
│   PENDING   │ ─────────────────▶  │  COMPLETED  │
│ completed=  │                     │ completed=  │
│    False    │ ◀─────────────────  │    True     │
└─────────────┘    incomplete()     └─────────────┘
```

## Storage Structure

### In-Memory Store

```python
# Task storage: dict[task_id, Task]
_tasks: dict[int, Task] = {}

# ID counter for auto-increment
_next_id: int = 1
```

#### Storage Operations

| Operation | Method | Complexity |
|-----------|--------|------------|
| Create | `_tasks[id] = task` | O(1) |
| Read (by ID) | `_tasks.get(id)` | O(1) |
| Read (all) | `list(_tasks.values())` | O(n) |
| Update | `_tasks[id].field = value` | O(1) |
| Delete | `del _tasks[id]` | O(1) |

## Service Layer Interface

### TaskService

```python
class TaskService:
    """Manages task operations with in-memory storage."""

    def add_task(self, title: str, description: str | None = None) -> Task:
        """Create a new task. Raises ValidationError if title is empty."""

    def get_task(self, task_id: int) -> Task | None:
        """Get task by ID. Returns None if not found."""

    def list_tasks(self) -> list[Task]:
        """Return all tasks ordered by creation time."""

    def update_task(self, task_id: int, title: str | None = None,
                    description: str | None = None) -> Task:
        """Update task fields. Raises TaskNotFoundError if ID invalid."""

    def delete_task(self, task_id: int) -> bool:
        """Delete task by ID. Raises TaskNotFoundError if ID invalid."""

    def toggle_complete(self, task_id: int) -> Task:
        """Toggle task completion status. Raises TaskNotFoundError if ID invalid."""
```

## Exceptions

```python
class TodoAppError(Exception):
    """Base exception for todo application."""
    pass

class TaskNotFoundError(TodoAppError):
    """Raised when a task ID does not exist."""
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task with ID {task_id} not found")

class ValidationError(TodoAppError):
    """Raised when input validation fails."""
    pass
```

## Phase 2 Evolution Notes

The data model is designed to evolve to database persistence:

1. **Task entity** → SQLModel/SQLAlchemy model with same fields
2. **Storage dict** → Database table with `id` as primary key
3. **TaskService** → Repository pattern with same interface
4. **Exceptions** → Can be reused as-is

```python
# Phase 2 evolution example (SQLModel)
from sqlmodel import SQLModel, Field
from datetime import datetime

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
```
