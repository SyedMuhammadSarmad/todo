"""Command parser and dispatcher for the CLI."""

from src.lib.exceptions import TaskNotFoundError, ValidationError
from src.services.task_service import TaskService

from src.cli import display


class CommandHandler:
    """Handles CLI command parsing and execution."""

    def __init__(self, task_service: TaskService) -> None:
        self._task_service = task_service
        self._commands: dict[str, callable] = {
            "add": self._handle_add,
            "list": self._handle_list,
            "complete": self._handle_complete,
            "update": self._handle_update,
            "delete": self._handle_delete,
            "help": self._handle_help,
            "exit": self._handle_exit,
            "quit": self._handle_exit,
        }

    def parse_command(self, input_string: str) -> tuple[str, str]:
        """Extract command and arguments from input string.

        Args:
            input_string: Raw user input.

        Returns:
            Tuple of (command_name, arguments_string).
        """
        parts = input_string.strip().split(maxsplit=1)
        if not parts:
            return "", ""
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        return command, args

    def execute(self, input_string: str) -> str | None:
        """Execute a command from user input.

        Args:
            input_string: Raw user input.

        Returns:
            Output string to display, or None for exit.
        """
        command, args = self.parse_command(input_string)

        if not command:
            return ""

        handler = self._commands.get(command)
        if handler is None:
            return display.format_unknown_command(command)

        return handler(args)

    def _handle_add(self, args: str) -> str:
        """Handle the add command."""
        title, description = self._parse_add_args(args)

        if not title:
            return display.format_error("Title cannot be empty")

        try:
            task = self._task_service.add_task(title, description)
            return display.format_task_added(task)
        except ValidationError as e:
            return display.format_error(str(e))

    def _parse_add_args(self, args: str) -> tuple[str, str | None]:
        """Parse add command arguments.

        Supports: add <title> or add <title> | <description>

        Args:
            args: Arguments string after 'add'.

        Returns:
            Tuple of (title, description or None).
        """
        if "|" in args:
            parts = args.split("|", 1)
            title = parts[0].strip()
            description = parts[1].strip() if len(parts) > 1 else None
            return title, description
        return args.strip(), None

    def _handle_list(self, args: str) -> str:
        """Handle the list command."""
        tasks = self._task_service.list_tasks()
        if not tasks:
            return display.format_empty_list()
        return display.format_task_list(tasks)

    def _handle_complete(self, args: str) -> str:
        """Handle the complete command."""
        task_id = self._parse_task_id(args)
        if task_id is None:
            return display.format_error("Please provide a valid task ID")

        try:
            task = self._task_service.toggle_complete(task_id)
            return display.format_complete_toggle(task.id, task.completed)
        except TaskNotFoundError as e:
            return display.format_error(str(e))

    def _handle_update(self, args: str) -> str:
        """Handle the update command."""
        result = self._parse_update_args(args)
        if result is None:
            return display.format_error(
                "Usage: update <id> title <value> or update <id> desc <value>"
            )

        task_id, field, value = result

        try:
            if field == "title":
                task = self._task_service.update_task(task_id, title=value)
                return display.format_task_updated(task_id, "title", value)
            elif field == "desc":
                task = self._task_service.update_task(task_id, description=value)
                return display.format_task_updated(task_id, "description", None)
        except TaskNotFoundError as e:
            return display.format_error(str(e))
        except ValidationError as e:
            return display.format_error(str(e))

        return display.format_error(
            "Usage: update <id> title <value> or update <id> desc <value>"
        )

    def _parse_update_args(self, args: str) -> tuple[int, str, str] | None:
        """Parse update command arguments.

        Supports: update <id> title <value> or update <id> desc <value>

        Args:
            args: Arguments string after 'update'.

        Returns:
            Tuple of (task_id, field, value) or None if invalid.
        """
        parts = args.strip().split(maxsplit=2)
        if len(parts) < 3:
            return None

        try:
            task_id = int(parts[0])
        except ValueError:
            return None

        field = parts[1].lower()
        if field not in ("title", "desc"):
            return None

        value = parts[2]
        return task_id, field, value

    def _handle_delete(self, args: str) -> str:
        """Handle the delete command."""
        task_id = self._parse_task_id(args)
        if task_id is None:
            return display.format_error("Please provide a valid task ID")

        try:
            self._task_service.delete_task(task_id)
            return display.format_task_deleted(task_id)
        except TaskNotFoundError as e:
            return display.format_error(str(e))

    def _parse_task_id(self, args: str) -> int | None:
        """Parse a task ID from arguments.

        Args:
            args: Arguments string containing the ID.

        Returns:
            The parsed integer ID, or None if invalid.
        """
        try:
            return int(args.strip())
        except ValueError:
            return None

    def _handle_help(self, args: str) -> str:
        """Handle the help command."""
        return display.format_help()

    def _handle_exit(self, args: str) -> None:
        """Handle the exit/quit command."""
        return None
