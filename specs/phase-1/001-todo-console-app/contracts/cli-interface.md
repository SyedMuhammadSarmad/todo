# CLI Interface Contract: Todo Console App

**Date**: 2025-12-10
**Feature**: 001-todo-console-app
**Version**: 1.0.0

## Overview

This document defines the command-line interface contract for the Phase 1 Todo Console App. All commands follow a consistent pattern for input parsing and output formatting.

## Application Flow

```
┌──────────────────────────────────────┐
│         Application Start            │
│   Display welcome + help hint        │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│           REPL Loop                  │
│   1. Display prompt "todo> "         │
│   2. Read user input                 │
│   3. Parse command + arguments       │
│   4. Execute command handler         │◀──┐
│   5. Display result/error            │   │
└──────────────────┬───────────────────┘   │
                   │                       │
                   ▼                       │
              ┌────────┐                   │
              │  exit? │───No─────────────►┘
              └────┬───┘
                   │ Yes
                   ▼
┌──────────────────────────────────────┐
│         Application Exit             │
│       Display goodbye message        │
└──────────────────────────────────────┘
```

## Commands

### 1. ADD - Create a New Task

**Syntax**:
```
add <title>
add <title> | <description>
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `title` | Yes | Task title (non-empty string) |
| `description` | No | Task description (after `\|` separator) |

**Success Output**:
```
✓ Task added: [ID] <title>
```

**Error Output**:
```
✗ Error: Title cannot be empty
```

**Examples**:
```
todo> add Buy groceries
✓ Task added: [1] Buy groceries

todo> add Call mom | Discuss weekend plans
✓ Task added: [2] Call mom

todo> add
✗ Error: Title cannot be empty
```

---

### 2. LIST - View All Tasks

**Syntax**:
```
list
```

**Arguments**: None

**Success Output (with tasks)**:
```
Tasks:
  [ ] 1. Buy groceries
  [x] 2. Call mom
      └─ Discuss weekend plans
  [ ] 3. Write report
```

**Success Output (empty)**:
```
No tasks yet. Use 'add <title>' to create one.
```

**Format Details**:
- `[ ]` = Pending task
- `[x]` = Completed task
- Description shown indented below title (if present)

---

### 3. COMPLETE - Toggle Task Completion

**Syntax**:
```
complete <id>
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Numeric task ID |

**Success Output**:
```
✓ Task 1 marked as completed
✓ Task 1 marked as pending
```

**Error Output**:
```
✗ Error: Task with ID 99 not found
✗ Error: Please provide a valid task ID
```

**Examples**:
```
todo> complete 1
✓ Task 1 marked as completed

todo> complete 1
✓ Task 1 marked as pending

todo> complete abc
✗ Error: Please provide a valid task ID

todo> complete 99
✗ Error: Task with ID 99 not found
```

---

### 4. UPDATE - Modify Task Details

**Syntax**:
```
update <id> title <new_title>
update <id> desc <new_description>
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Numeric task ID |
| `field` | Yes | Field to update: `title` or `desc` |
| `value` | Yes | New value for the field |

**Success Output**:
```
✓ Task 1 title updated to: Buy healthy groceries
✓ Task 1 description updated
```

**Error Output**:
```
✗ Error: Task with ID 99 not found
✗ Error: Title cannot be empty
✗ Error: Usage: update <id> title <value> or update <id> desc <value>
```

**Examples**:
```
todo> update 1 title Buy healthy groceries
✓ Task 1 title updated to: Buy healthy groceries

todo> update 1 desc Get vegetables and fruits
✓ Task 1 description updated

todo> update 1 title
✗ Error: Title cannot be empty
```

---

### 5. DELETE - Remove a Task

**Syntax**:
```
delete <id>
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Numeric task ID |

**Success Output**:
```
✓ Task 1 deleted
```

**Error Output**:
```
✗ Error: Task with ID 99 not found
✗ Error: Please provide a valid task ID
```

**Examples**:
```
todo> delete 1
✓ Task 1 deleted

todo> delete 99
✗ Error: Task with ID 99 not found
```

---

### 6. HELP - Show Available Commands

**Syntax**:
```
help
```

**Output**:
```
Available commands:
  add <title> [| description]  - Add a new task
  list                         - View all tasks
  complete <id>                - Toggle task completion
  update <id> title <value>    - Update task title
  update <id> desc <value>     - Update task description
  delete <id>                  - Delete a task
  help                         - Show this help message
  exit                         - Exit the application
```

---

### 7. EXIT - Quit Application

**Syntax**:
```
exit
quit
```

**Output**:
```
Goodbye!
```

---

## Error Handling

### Unknown Command

```
todo> foo
✗ Unknown command: foo. Type 'help' for available commands.
```

### Empty Input

```
todo>
(no output, show prompt again)
```

## Output Conventions

| Symbol | Meaning |
|--------|---------|
| `✓` | Success |
| `✗` | Error |
| `[ ]` | Pending task |
| `[x]` | Completed task |

## Prompt Format

```
todo>
```
- Single space after `>`
- No trailing characters
