"""Business logic for task operations with in-memory storage."""

from src.lib.exceptions import TaskNotFoundError, ValidationError
from src.lib.id_generator import IdGenerator
from src.models.task import Task


class TaskService:
    """Manages task operations with in-memory storage."""

    def __init__(self) -> None:
        self._tasks: dict[int, Task] = {}
        self._id_generator = IdGenerator()

    def add_task(self, title: str, description: str | None = None) -> Task:
        """Create a new task.

        Args:
            title: The task title (required, non-empty).
            description: Optional task description.

        Returns:
            The created Task with assigned ID.

        Raises:
            ValidationError: If title is empty or whitespace-only.
        """
        if not title or not title.strip():
            raise ValidationError("Title cannot be empty")

        task = Task(
            id=self._id_generator.next_id(),
            title=title.strip(),
            description=description.strip() if description else None,
        )
        self._tasks[task.id] = task
        return task

    def get_task(self, task_id: int) -> Task | None:
        """Get task by ID.

        Args:
            task_id: The task ID to look up.

        Returns:
            The Task if found, None otherwise.
        """
        return self._tasks.get(task_id)

    def list_tasks(self) -> list[Task]:
        """Return all tasks ordered by creation time.

        Returns:
            List of all tasks sorted by created_at.
        """
        return sorted(self._tasks.values(), key=lambda t: t.created_at)

    def update_task(
        self,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """Update task fields.

        Args:
            task_id: The ID of the task to update.
            title: New title (if provided, must be non-empty).
            description: New description.

        Returns:
            The updated Task.

        Raises:
            TaskNotFoundError: If task ID does not exist.
            ValidationError: If new title is empty.
        """
        task = self._tasks.get(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        if title is not None:
            if not title.strip():
                raise ValidationError("Title cannot be empty")
            task.title = title.strip()

        if description is not None:
            task.description = description.strip() if description.strip() else None

        return task

    def delete_task(self, task_id: int) -> bool:
        """Delete task by ID.

        Args:
            task_id: The ID of the task to delete.

        Returns:
            True if task was deleted.

        Raises:
            TaskNotFoundError: If task ID does not exist.
        """
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)

        del self._tasks[task_id]
        return True

    def toggle_complete(self, task_id: int) -> Task:
        """Toggle task completion status.

        Args:
            task_id: The ID of the task to toggle.

        Returns:
            The updated Task.

        Raises:
            TaskNotFoundError: If task ID does not exist.
        """
        task = self._tasks.get(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        task.completed = not task.completed
        return task
