"""Application entry point with REPL loop."""

from src.cli import display
from src.cli.commands import CommandHandler
from src.services.task_service import TaskService


def main() -> None:
    """Run the todo application REPL."""
    task_service = TaskService()
    handler = CommandHandler(task_service)

    print(display.format_welcome())
    print()

    while True:
        try:
            user_input = input("todo> ")
        except (EOFError, KeyboardInterrupt):
            print()
            print(display.format_goodbye())
            break

        # Handle empty input gracefully
        if not user_input.strip():
            continue

        result = handler.execute(user_input)

        # None signals exit
        if result is None:
            print(display.format_goodbye())
            break

        # Print non-empty results
        if result:
            print(result)


if __name__ == "__main__":
    main()
