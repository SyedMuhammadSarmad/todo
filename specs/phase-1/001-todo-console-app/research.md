# Research: Todo Console App (Phase 1)

**Date**: 2025-12-10
**Feature**: 001-todo-console-app
**Status**: Complete

## Overview

This document consolidates research findings for implementing the Phase 1 Todo Console App. All technical context items have been resolved - no NEEDS CLARIFICATION items remain.

## Research Tasks

### 1. Python CLI Best Practices

**Decision**: Use a simple REPL (Read-Eval-Print Loop) pattern with `input()` for command entry.

**Rationale**:
- Standard library only (no Click, Typer, or argparse complexity needed for interactive mode)
- Simple command parsing with string split is sufficient for 5 commands
- REPL pattern matches the "run continuously until exit" requirement

**Alternatives Considered**:
- `argparse`: Over-engineered for interactive app; better for one-shot CLI tools
- `Click`/`Typer`: External dependencies violate YAGNI and constitution principles
- `cmd` module: Adds complexity without benefit for simple command set

### 2. In-Memory Data Storage Pattern

**Decision**: Use a Python dictionary with auto-incrementing integer keys for task storage.

**Rationale**:
- O(1) lookup by ID for update/delete/complete operations
- Dictionary preserves insertion order (Python 3.7+)
- Simple counter for ID generation
- Easy to replace with database in Phase 2 (service layer abstraction)

**Alternatives Considered**:
- List with linear search: O(n) lookup, complicates ID management
- Named tuples: Immutable, harder to update
- SQLite in-memory: Over-engineered, introduces SQL for simple CRUD

### 3. Task Model Design

**Decision**: Use Python `dataclass` with `field()` defaults for the Task entity.

**Rationale**:
- Type hints built-in (satisfies constitution)
- Less boilerplate than manual `__init__`
- Mutable by default (needed for updates)
- Easy serialization for Phase 2 (can add `asdict()`)

**Alternatives Considered**:
- Plain class: More boilerplate, no auto-generated methods
- TypedDict: No instance methods, less ergonomic
- Pydantic: External dependency, over-engineered for Phase 1

### 4. Command Parsing Strategy

**Decision**: Simple string parsing with command dispatcher dictionary.

**Rationale**:
- Commands are simple: `add <title> [description]`, `list`, `complete <id>`, `update <id> <field> <value>`, `delete <id>`, `help`, `exit`
- Dictionary maps command name to handler function
- Easy to extend for Phase 2

**Command Syntax Design**:
```
add <title>                    # Add task with title only
add <title> | <description>    # Add task with title and description (pipe separator)
list                           # Show all tasks
complete <id>                  # Toggle complete status
update <id> title <new_title>  # Update task title
update <id> desc <new_desc>    # Update task description
delete <id>                    # Delete task by ID
help                           # Show available commands
exit                           # Exit application
```

### 5. Error Handling Strategy

**Decision**: Return result objects or raise domain-specific exceptions.

**Rationale**:
- Service layer returns success/failure with message
- CLI layer formats error messages to stderr
- Clear separation of concerns

**Error Categories**:
- `TaskNotFoundError`: Invalid ID provided
- `ValidationError`: Empty title, invalid input format
- `CommandNotFoundError`: Unknown command entered

### 6. Testing Strategy

**Decision**: pytest with unit tests for model/service, integration tests for CLI flow.

**Rationale**:
- pytest is the de facto Python testing standard
- Unit tests verify business logic in isolation
- Integration tests verify end-to-end command flows
- No mocking needed for in-memory storage

**Test Coverage Goals**:
- All 5 user stories have corresponding test scenarios
- All 12 functional requirements covered
- Edge cases from spec tested (empty title, non-numeric ID, etc.)

## Technology Stack (Confirmed)

| Component | Technology | Notes |
|-----------|------------|-------|
| Language | Python 3.13+ | Latest stable, per constitution |
| Package Manager | UV | Per constitution |
| Data Model | dataclass | Standard library |
| Storage | dict | In-memory, keyed by task ID |
| CLI | input() + REPL | No external deps |
| Testing | pytest | Only dev dependency |
| Type Checking | Built-in hints | Verified by IDE/mypy optional |

## Open Questions

*None - all requirements are clear from spec and constitution.*

## Next Steps

Proceed to Phase 1:
1. Create `data-model.md` - Define Task entity schema
2. Create `contracts/` - CLI command interface contracts
3. Create `quickstart.md` - Developer setup guide
