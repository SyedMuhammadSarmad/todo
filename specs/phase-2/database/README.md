# Database Specifications

Database schema and data model specifications for Neon PostgreSQL.

## Purpose

Database specs define:
- Table schemas with columns and types
- Relationships and foreign keys
- Indexes for query performance
- Constraints and validations
- Migration strategy

## Files to Create

- **schema.md**: Complete database schema
  - `users` table (managed by Better Auth)
  - `tasks` table
  - Indexes and constraints
  - Relationships

## Schema Format

Each table should document:

1. **Table Name**
2. **Columns**: name, type, constraints
3. **Primary Key**
4. **Foreign Keys**
5. **Indexes**
6. **Constraints**: UNIQUE, NOT NULL, CHECK
7. **Timestamps**: created_at, updated_at

## Example

```markdown
### Table: tasks

Stores user tasks with completion status.

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing task ID |
| user_id | VARCHAR(255) | NOT NULL, FOREIGN KEY → users.id | Owner of the task |
| title | VARCHAR(200) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Optional description |
| completed | BOOLEAN | NOT NULL, DEFAULT false | Completion status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_tasks_user_id` ON `user_id` - For filtering by user
- `idx_tasks_completed` ON `completed` - For status filtering

**Foreign Keys**:
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**SQLModel Definition**:
```python
from sqlmodel import Field, SQLModel
from datetime import datetime

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    description: str | None = None
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```
```

---

**Status**: 📝 To be created via `/sp.plan`
**Related**: See `../api/` for endpoint models, `../features/` for requirements

**Workflow**:
1. ✅ `/sp.specify` creates feature specs in `../features/` (WHAT & WHY)
2. ⏭️ `/sp.plan` generates database schema in this folder (HOW)
