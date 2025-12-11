# Quickstart Guide: Todo Console App

**Feature**: 001-todo-console-app
**Date**: 2025-12-10

## Prerequisites

- Python 3.13+
- UV package manager

## Setup

### 1. Initialize UV Project

```bash
# From repository root
uv init --python 3.13

# Or if pyproject.toml exists
uv sync
```

### 2. Project Structure

After implementation, the project structure will be:

```
.
├── pyproject.toml
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py
│   ├── cli/
│   │   ├── __init__.py
│   │   ├── commands.py
│   │   └── display.py
│   └── lib/
│       ├── __init__.py
│       └── id_generator.py
└── tests/
    ├── __init__.py
    ├── unit/
    └── integration/
```

### 3. Install Development Dependencies

```bash
uv add --dev pytest
```

## Running the Application

```bash
# Run the todo app
uv run python -m src.main

# Or with the entry point (after configuring pyproject.toml)
uv run todo
```

## Running Tests

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/unit/test_task_service.py

# Run with coverage (if pytest-cov installed)
uv run pytest --cov=src
```

## Configuration

### pyproject.toml

```toml
[project]
name = "todo-console-app"
version = "0.1.0"
description = "Phase 1: In-Memory Python Console Todo App"
requires-python = ">=3.13"
dependencies = []

[project.scripts]
todo = "src.main:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v"

[tool.hatch.build.targets.wheel]
packages = ["src"]
```

## Usage Examples

### Basic Session

```
$ uv run todo

Welcome to Todo App! Type 'help' for available commands.

todo> add Buy groceries
✓ Task added: [1] Buy groceries

todo> add Call mom | Discuss weekend plans
✓ Task added: [2] Call mom

todo> list
Tasks:
  [ ] 1. Buy groceries
  [ ] 2. Call mom
      └─ Discuss weekend plans

todo> complete 1
✓ Task 1 marked as completed

todo> list
Tasks:
  [x] 1. Buy groceries
  [ ] 2. Call mom
      └─ Discuss weekend plans

todo> delete 1
✓ Task 1 deleted

todo> exit
Goodbye!
```

## Troubleshooting

### Common Issues

**Python version mismatch**:
```bash
# Check Python version
python --version

# Use UV to get the right version
uv python install 3.13
```

**Module not found**:
```bash
# Ensure you're in the project root
# Run with -m flag
uv run python -m src.main
```

**Tests failing to find modules**:
```bash
# Install package in editable mode
uv pip install -e .
```

## Development Workflow

1. Make changes to source code
2. Run tests: `uv run pytest`
3. Test manually: `uv run todo`
4. Commit changes with descriptive message

## Next Steps

After Phase 1 is complete:
- Phase 2 adds persistence with Neon DB
- Phase 2 adds web interface with Next.js + FastAPI
- Service layer (`task_service.py`) will be reused by API endpoints
