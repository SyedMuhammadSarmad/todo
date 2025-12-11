"""Output formatting for the CLI."""

from src.models.task import Task


def format_task_added(task: Task) -> str:
    """Format success message for task creation.

    Args:
        task: The created task.

    Returns:
        Formatted success message.
    """
    return f"\u2713 Task added: [{task.id}] {task.title}"


def format_error(message: str) -> str:
    """Format error message.

    Args:
        message: The error message.

    Returns:
        Formatted error message with X symbol.
    """
    return f"\u2717 Error: {message}"


def format_task_list(tasks: list[Task]) -> str:
    """Format task list for display.

    Args:
        tasks: List of tasks to display.

    Returns:
        Formatted task list string.
    """
    lines = ["Tasks:"]
    for task in tasks:
        status = "[x]" if task.completed else "[ ]"
        lines.append(f"  {status} {task.id}. {task.title}")
        if task.description:
            lines.append(f"      \u2514\u2500 {task.description}")
    return "\n".join(lines)


def format_empty_list() -> str:
    """Format message for empty task list.

    Returns:
        Message indicating no tasks exist.
    """
    return "No tasks yet. Use 'add <title>' to create one."


def format_complete_toggle(task_id: int, is_completed: bool) -> str:
    """Format success message for completion toggle.

    Args:
        task_id: The task ID.
        is_completed: Whether task is now completed.

    Returns:
        Formatted success message.
    """
    status = "completed" if is_completed else "pending"
    return f"\u2713 Task {task_id} marked as {status}"


def format_task_updated(task_id: int, field: str, value: str | None) -> str:
    """Format success message for task update.

    Args:
        task_id: The task ID.
        field: The field that was updated ('title' or 'description').
        value: The new value (shown for title, omitted for description).

    Returns:
        Formatted success message.
    """
    if field == "title" and value:
        return f"\u2713 Task {task_id} title updated to: {value}"
    return f"\u2713 Task {task_id} {field} updated"


def format_task_deleted(task_id: int) -> str:
    """Format success message for task deletion.

    Args:
        task_id: The deleted task ID.

    Returns:
        Formatted success message.
    """
    return f"\u2713 Task {task_id} deleted"


def format_help() -> str:
    """Format help message showing available commands.

    Returns:
        Formatted help text.
    """
    return """Available commands:
  add <title> [| description]  - Add a new task
  list                         - View all tasks
  complete <id>                - Toggle task completion
  update <id> title <value>    - Update task title
  update <id> desc <value>     - Update task description
  delete <id>                  - Delete a task
  help                         - Show this help message
  exit                         - Exit the application"""


def format_welcome() -> str:
    """Format welcome message.

    Returns:
        Welcome message string.
    """
    return "Welcome to Todo App! Type 'help' for available commands."


def format_goodbye() -> str:
    """Format goodbye message.

    Returns:
        Goodbye message string.
    """
    return "Goodbye!"


def format_unknown_command(command: str) -> str:
    """Format error for unknown command.

    Args:
        command: The unknown command entered.

    Returns:
        Formatted error message.
    """
    return f"\u2717 Unknown command: {command}. Type 'help' for available commands."
