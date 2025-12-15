"""ID generator for task instances."""


class IdGenerator:
    """Generates sequential integer IDs for tasks."""

    def __init__(self, start_id: int = 1):
        """Initialize the ID generator.

        Args:
            start_id: The starting ID value (default: 1).
        """
        self._current_id = start_id

    def next_id(self) -> int:
        """Generate and return the next ID.

        Returns:
            The next sequential integer ID.
        """
        next_id = self._current_id
        self._current_id += 1
        return next_id

    def reset(self, start_id: int = 1) -> None:
        """Reset the generator to a specific starting ID.

        Args:
            start_id: The new starting ID value (default: 1).
        """
        self._current_id = start_id
