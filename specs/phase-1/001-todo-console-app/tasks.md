# Tasks: Todo Console App (Phase 1)

**Input**: Design documents from `/specs/001-todo-console-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-interface.md
**Branch**: `001-todo-console-app`
**Date**: 2025-12-10

**Tests**: Test tasks are NOT included by default. Tests can be added if explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Single project structure per plan.md:
- Source: `src/` at repository root
- Tests: `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize UV project with Python 3.13+ in `pyproject.toml`
- [x] T002 Create project directory structure per plan.md (`src/`, `src/models/`, `src/services/`, `src/cli/`, `src/lib/`, `tests/`, `tests/unit/`, `tests/integration/`)
- [x] T003 [P] Create `src/__init__.py` package marker
- [x] T004 [P] Create `src/models/__init__.py` package marker
- [x] T005 [P] Create `src/services/__init__.py` package marker
- [x] T006 [P] Create `src/cli/__init__.py` package marker
- [x] T007 [P] Create `src/lib/__init__.py` package marker
- [x] T008 [P] Create `tests/__init__.py` package marker
- [x] T009 [P] Create `tests/unit/__init__.py` package marker
- [x] T010 [P] Create `tests/integration/__init__.py` package marker
- [x] T011 Add pytest as dev dependency with `uv add --dev pytest`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 Create custom exceptions (`TodoAppError`, `TaskNotFoundError`, `ValidationError`) in `src/lib/exceptions.py`
- [x] T013 Create ID generator module with auto-incrementing counter in `src/lib/id_generator.py`
- [x] T014 Create Task dataclass model with id, title, description, completed, created_at in `src/models/task.py`
- [x] T015 Export Task from `src/models/__init__.py`
- [x] T016 Export exceptions from `src/lib/__init__.py`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add New Task (Priority: P1)

**Goal**: As a user, I want to add a new task to my todo list so that I can track work I need to complete.

**Independent Test**: Run the add command with a title and optional description, then verify the task appears in the list with a unique ID.

### Implementation for User Story 1

- [x] T017 [US1] Implement `add_task(title, description)` method in `src/services/task_service.py` with validation
- [x] T018 [US1] Export TaskService from `src/services/__init__.py`
- [x] T019 [US1] Implement `parse_add_command(args)` in `src/cli/commands.py` to extract title and optional description (pipe separator)
- [x] T020 [US1] Implement `format_task_added(task)` in `src/cli/display.py` to show success message per CLI contract
- [x] T021 [US1] Implement `format_error(message)` in `src/cli/display.py` for error output with checkmark/X symbols
- [x] T022 [US1] Export display functions from `src/cli/__init__.py`

**Checkpoint**: User Story 1 should be functional - can add tasks with title and optional description

---

## Phase 4: User Story 2 - View All Tasks (Priority: P1)

**Goal**: As a user, I want to view all my tasks so that I can see what work is pending and what has been completed.

**Independent Test**: Add several tasks, then run the list command and verify all tasks display with their ID, title, and completion status.

### Implementation for User Story 2

- [x] T023 [US2] Implement `list_tasks()` method in `src/services/task_service.py` returning all tasks ordered by creation time
- [x] T024 [US2] Implement `parse_list_command()` in `src/cli/commands.py`
- [x] T025 [US2] Implement `format_task_list(tasks)` in `src/cli/display.py` showing `[ ]`/`[x]` status, ID, title, and indented description per CLI contract
- [x] T026 [US2] Implement `format_empty_list()` in `src/cli/display.py` for no-tasks message

**Checkpoint**: User Stories 1 AND 2 should work - can add tasks and view the list

---

## Phase 5: User Story 3 - Mark Task Complete/Incomplete (Priority: P2)

**Goal**: As a user, I want to mark a task as complete or incomplete so that I can track my progress on work items.

**Independent Test**: Add a task, mark it complete, verify status changed, then toggle it back to incomplete.

### Implementation for User Story 3

- [x] T027 [US3] Implement `get_task(task_id)` method in `src/services/task_service.py` returning Task or None
- [x] T028 [US3] Implement `toggle_complete(task_id)` method in `src/services/task_service.py` raising TaskNotFoundError if not found
- [x] T029 [US3] Implement `parse_complete_command(args)` in `src/cli/commands.py` extracting and validating task ID
- [x] T030 [US3] Implement `format_complete_toggle(task_id, is_completed)` in `src/cli/display.py` per CLI contract

**Checkpoint**: User Stories 1, 2, AND 3 should work - can add, view, and toggle completion

---

## Phase 6: User Story 4 - Update Task Details (Priority: P3)

**Goal**: As a user, I want to update a task's title or description so that I can correct mistakes or add more detail.

**Independent Test**: Add a task, update its title, verify the change persists when viewing tasks.

### Implementation for User Story 4

- [x] T031 [US4] Implement `update_task(task_id, title, description)` method in `src/services/task_service.py` with validation
- [x] T032 [US4] Implement `parse_update_command(args)` in `src/cli/commands.py` supporting `update <id> title <value>` and `update <id> desc <value>` syntax
- [x] T033 [US4] Implement `format_task_updated(task_id, field, value)` in `src/cli/display.py` per CLI contract

**Checkpoint**: User Stories 1-4 should work - can add, view, toggle, and update tasks

---

## Phase 7: User Story 5 - Delete Task (Priority: P3)

**Goal**: As a user, I want to delete a task so that I can remove items that are no longer relevant.

**Independent Test**: Add a task, delete it by ID, then verify it no longer appears in the task list.

### Implementation for User Story 5

- [x] T034 [US5] Implement `delete_task(task_id)` method in `src/services/task_service.py` raising TaskNotFoundError if not found
- [x] T035 [US5] Implement `parse_delete_command(args)` in `src/cli/commands.py` extracting and validating task ID
- [x] T036 [US5] Implement `format_task_deleted(task_id)` in `src/cli/display.py` per CLI contract

**Checkpoint**: All CRUD operations complete - can add, view, toggle, update, and delete tasks

---

## Phase 8: CLI Integration & REPL

**Purpose**: Wire up the complete command-line interface

- [x] T037 Implement command dispatcher mapping command names to handlers in `src/cli/commands.py`
- [x] T038 Implement `parse_command(input_string)` to extract command and arguments in `src/cli/commands.py`
- [x] T039 Implement `format_help()` in `src/cli/display.py` showing all available commands per CLI contract
- [x] T040 Implement `format_welcome()` and `format_goodbye()` in `src/cli/display.py`
- [x] T041 Implement `format_unknown_command(command)` in `src/cli/display.py`
- [x] T042 Implement REPL loop in `src/main.py` with welcome message, `todo>` prompt, command parsing, and graceful exit
- [x] T043 Configure `[project.scripts]` entry point in `pyproject.toml` for `todo = "src.main:main"`

**Checkpoint**: Application is fully functional via `uv run todo` command

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T044 Add input validation for non-numeric ID errors in command parsers in `src/cli/commands.py`
- [x] T045 Handle empty input gracefully (no output, show prompt again) in `src/main.py`
- [x] T046 Support `quit` as alias for `exit` command in `src/cli/commands.py`
- [x] T047 Run quickstart.md validation - verify all commands work as documented
- [x] T048 Verify all acceptance scenarios from spec.md pass manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Add) and US2 (View) are both P1 priority
  - US2 depends on US1 (need tasks to view)
  - US3 (Complete) depends on US1 (need tasks to complete)
  - US4 (Update) depends on US1 (need tasks to update)
  - US5 (Delete) depends on US1 (need tasks to delete)
- **CLI Integration (Phase 8)**: Depends on all user story services being implemented
- **Polish (Phase 9)**: Depends on CLI Integration being complete

### User Story Dependencies

- **User Story 1 (P1 - Add)**: Can start after Foundational - Foundation for all other stories
- **User Story 2 (P1 - View)**: Can run in parallel with US1 once Foundational done
- **User Story 3 (P2 - Complete)**: Can start after Foundational - Independent service method
- **User Story 4 (P3 - Update)**: Can start after Foundational - Independent service method
- **User Story 5 (P3 - Delete)**: Can start after Foundational - Independent service method

### Within Each User Story

- Service layer before CLI layer
- Core implementation before formatting
- All tasks in a story share a TaskService instance

### Parallel Opportunities

**Phase 1 Setup**:
- T003-T010 (all `__init__.py` files) can run in parallel

**After Foundational Phase**:
- US1, US3, US4, US5 service methods can be developed in parallel (different methods in same file, or split per method)
- Display formatting functions (T020, T021, T025, T026, T30, T33, T36) can be developed in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all __init__.py file creations together:
Task T003: "Create src/__init__.py package marker"
Task T004: "Create src/models/__init__.py package marker"
Task T005: "Create src/services/__init__.py package marker"
Task T006: "Create src/cli/__init__.py package marker"
Task T007: "Create src/lib/__init__.py package marker"
```

---

## Parallel Example: Display Functions

```bash
# Launch independent display formatting functions:
Task T020: "Implement format_task_added(task) in src/cli/display.py"
Task T021: "Implement format_error(message) in src/cli/display.py"
Task T025: "Implement format_task_list(tasks) in src/cli/display.py"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Add Task)
4. Complete Phase 4: User Story 2 (View Tasks)
5. Complete Phase 8: CLI Integration (minimal - add, list, help, exit)
6. **STOP and VALIDATE**: Test add and list independently
7. Deploy/demo if ready - **This is a functional MVP!**

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add User Story 1 + 2 + CLI -> MVP (add, list, help, exit)
3. Add User Story 3 -> Can mark tasks complete
4. Add User Story 4 -> Can update tasks
5. Add User Story 5 -> Can delete tasks
6. Polish phase -> Robust error handling
7. Each story adds value without breaking previous stories

---

## Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1: Setup | 11 tasks | Project initialization |
| Phase 2: Foundational | 5 tasks | Core models and exceptions |
| Phase 3: US1 - Add | 6 tasks | Add new task capability |
| Phase 4: US2 - View | 4 tasks | View all tasks capability |
| Phase 5: US3 - Complete | 4 tasks | Toggle completion status |
| Phase 6: US4 - Update | 3 tasks | Update task details |
| Phase 7: US5 - Delete | 3 tasks | Delete task capability |
| Phase 8: CLI Integration | 7 tasks | REPL and command wiring |
| Phase 9: Polish | 5 tasks | Error handling and validation |
| **Total** | **48 tasks** | |

### Tasks Per User Story

- US1 (Add New Task): 6 tasks
- US2 (View All Tasks): 4 tasks
- US3 (Mark Complete): 4 tasks
- US4 (Update Task): 3 tasks
- US5 (Delete Task): 3 tasks

### MVP Scope (Recommended)

For minimum viable product, complete:
- Phase 1: Setup (T001-T011)
- Phase 2: Foundational (T012-T016)
- Phase 3: User Story 1 - Add (T017-T022)
- Phase 4: User Story 2 - View (T023-T026)
- Phase 8: CLI Integration (T037-T043)

**MVP Task Count**: 33 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests not included - add via separate request if TDD approach desired
