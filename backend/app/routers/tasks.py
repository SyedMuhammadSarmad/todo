"""
Task CRUD endpoints with authentication and user isolation.

All endpoints require JWT authentication via Better Auth cookie.
Multi-user data isolation: users can only access their own tasks.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from datetime import datetime
from typing import Optional

from ..dependencies import get_current_user_id, get_session
from ..models.task import Task, TaskCreate, TaskUpdate, TaskRead, TaskListResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: 'pending' or 'completed'"),
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Get all tasks for the authenticated user.

    Query Parameters:
        - status: Optional filter ('pending' or 'completed')

    Returns:
        TaskListResponse with list of tasks and total count

    Security:
        - Requires authentication (JWT cookie)
        - Only returns tasks belonging to current user
    """
    # Build query - always filter by user_id for data isolation
    statement = select(Task).where(Task.user_id == current_user_id)

    # Apply status filter if provided
    if status_filter == "pending":
        statement = statement.where(Task.completed == False)
    elif status_filter == "completed":
        statement = statement.where(Task.completed == True)

    # Execute query
    tasks = session.exec(statement).all()

    return TaskListResponse(
        tasks=[TaskRead.from_orm(task) for task in tasks],
        total=len(tasks)
    )


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Create a new task for the authenticated user.

    Request Body:
        - title: Task title (required, max 200 chars)
        - description: Task description (optional, max 1000 chars)

    Returns:
        Created task with id and timestamps

    Security:
        - Requires authentication
        - Task automatically associated with current user
    """
    # Create task with user_id from JWT
    task = Task(
        **task_data.dict(),
        user_id=current_user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskRead.from_orm(task)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Get a specific task by ID.

    Path Parameters:
        - task_id: Task ID

    Returns:
        Task details

    Security:
        - Requires authentication
        - Verifies task belongs to current user (403 if not)

    Errors:
        - 404: Task not found
        - 403: Task belongs to another user
    """
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify task belongs to current user (data isolation)
    if task.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - this task belongs to another user"
        )

    return TaskRead.from_orm(task)


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Update an existing task.

    Path Parameters:
        - task_id: Task ID

    Request Body (all optional):
        - title: New title
        - description: New description
        - completed: Completion status

    Returns:
        Updated task

    Security:
        - Requires authentication
        - Verifies task ownership

    Errors:
        - 404: Task not found
        - 403: Task belongs to another user
    """
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify ownership
    if task.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - this task belongs to another user"
        )

    # Update only provided fields
    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    # Update timestamp
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskRead.from_orm(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Delete a task.

    Path Parameters:
        - task_id: Task ID

    Returns:
        204 No Content on success

    Security:
        - Requires authentication
        - Verifies task ownership

    Errors:
        - 404: Task not found
        - 403: Task belongs to another user
    """
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify ownership
    if task.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - this task belongs to another user"
        )

    session.delete(task)
    session.commit()

    return None


@router.patch("/{task_id}/complete", response_model=TaskRead)
async def toggle_task_completion(
    task_id: int,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Toggle task completion status (completed <-> pending).

    Path Parameters:
        - task_id: Task ID

    Returns:
        Updated task

    Security:
        - Requires authentication
        - Verifies task ownership

    Errors:
        - 404: Task not found
        - 403: Task belongs to another user
    """
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify ownership
    if task.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - this task belongs to another user"
        )

    # Toggle completion status
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskRead.from_orm(task)
