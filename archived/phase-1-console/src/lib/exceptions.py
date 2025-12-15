"""Custom exceptions for the todo application."""


class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, message: str):
        """Initialize ValidationError with a message.

        Args:
            message: Error message describing the validation failure.
        """
        self.message = message
        super().__init__(self.message)


class TaskNotFoundError(Exception):
    """Raised when a requested task ID does not exist."""

    def __init__(self, task_id: int):
        """Initialize TaskNotFoundError with the missing task ID.

        Args:
            task_id: The ID of the task that was not found.
        """
        self.task_id = task_id
        self.message = f"Task with ID {task_id} not found"
        super().__init__(self.message)
