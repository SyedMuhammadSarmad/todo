# Research: Task CRUD Operations

**Feature**: Task CRUD Operations
**Branch**: `001-task-crud`
**Date**: 2025-12-14
**Phase**: Research & Design Decisions

## Purpose

This document captures the research findings and design decisions made during the planning phase for implementing task CRUD operations in a multi-user web-based todo application. The goal is to establish best practices, architectural patterns, and technology-specific approaches before implementation begins.

## Design Decisions

### 1. Task API Design Patterns for FastAPI

**Context**: FastAPI supports multiple patterns for organizing REST APIs, including function-based routes, class-based views, and router composition.

**Options Considered**:
- Router-based organization with dependency injection
- Class-based views using APIRouter
- Flat function-based routes in a single file

**Decision**: Use APIRouter with dependency injection for JWT authentication and user context.

**Rationale**:
- Clean separation of concerns (routes in `routers/`, models in `models/`, schemas in `schemas/`)
- Dependency injection allows reusable auth middleware: `current_user: User = Depends(get_current_user)`
- Router composition enables modular API structure: `/api/{user_id}/tasks`
- Aligns with FastAPI best practices and scales to multiple resource types

**Trade-offs**:
- More files than flat structure (but better organized)
- Requires understanding of FastAPI's dependency injection system

**References**:
- FastAPI Router documentation: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- SQLModel + FastAPI integration: https://sqlmodel.tiangolo.com/tutorial/fastapi/

---

### 2. SQLModel Best Practices for Task Entity

**Context**: SQLModel combines SQLAlchemy ORM capabilities with Pydantic validation, allowing models to serve as both database tables and request/response schemas.

**Options Considered**:
- Single SQLModel class for table and schemas
- Separate classes for table model vs. API schemas
- Pure SQLAlchemy models with separate Pydantic schemas

**Decision**: Use inheritance pattern with separate SQLModel classes for table, create schema, and response schema.

**Rationale**:
- Base `TaskBase` class defines shared fields (title, description, completed)
- `Task` table model adds `id`, `user_id`, `created_at`, `updated_at`
- `TaskCreate` schema accepts user input without auto-generated fields
- `TaskRead` schema includes all fields for API responses
- Prevents accidentally exposing internal fields or accepting invalid inputs
- Type safety across database and API layers

**Trade-offs**:
- More verbose than single model (but safer and more explicit)
- Requires understanding of SQLModel inheritance patterns

**References**:
- SQLModel documentation: https://sqlmodel.tiangolo.com/
- Pattern: https://sqlmodel.tiangolo.com/tutorial/fastapi/multiple-models/

---

### 3. Next.js Form Handling and Validation

**Context**: Next.js App Router (v15+) supports Server Actions, but forms can also use client-side libraries like React Hook Form.

**Options Considered**:
- Server Actions with server-side validation
- React Hook Form with zod schema validation
- Native HTML5 form validation
- Formik + yup validation

**Decision**: Use React Hook Form with zod for client-side validation, calling API endpoints directly.

**Rationale**:
- React Hook Form provides excellent TypeScript support and developer experience
- Zod schemas enable runtime type validation matching backend Pydantic models
- Client-side validation gives immediate feedback (meets SC-007: 200ms validation)
- Reduces server round-trips for validation errors
- Composable validation logic can be shared across forms
- Next.js Server Actions add complexity for simple REST API consumption

**Trade-offs**:
- Client-side validation must be duplicated on backend for security
- Adds dependency on React Hook Form and zod libraries

**References**:
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/

---

### 4. JWT Middleware Integration

**Context**: Better Auth provides JWT tokens for authentication, and FastAPI needs to validate these tokens for protected routes.

**Options Considered**:
- Manual JWT decoding in each route handler
- FastAPI dependency function for token validation
- Middleware to attach user to request context
- Third-party JWT library integration

**Decision**: Implement `get_current_user` dependency function that validates JWT and returns User object.

**Rationale**:
- Dependency injection pattern: `current_user: User = Depends(get_current_user)`
- Centralizes token validation logic in one place
- Automatically handles 401 Unauthorized responses for invalid tokens
- Extracts `user_id` from JWT claims for data isolation
- Can be extended with role-based access control (RBAC) later
- Works seamlessly with FastAPI's automatic OpenAPI documentation

**Trade-offs**:
- Requires understanding of FastAPI dependencies
- JWT secret must be securely configured in environment

**Implementation Pattern**:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    payload = verify_jwt(token)  # Decode and validate
    user_id = payload.get("sub")
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user
```

**References**:
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- Better Auth JWT: https://www.better-auth.com/docs/concepts/jwt

---

### 5. Multi-User Data Isolation Strategies

**Context**: Each user must only see and modify their own tasks. The system must prevent unauthorized access to other users' data.

**Options Considered**:
- Row-level security in PostgreSQL
- Application-level filtering by `user_id`
- Separate tables per user (multi-tenancy)
- API gateway-level filtering

**Decision**: Application-level filtering using `user_id` foreign key with database constraints.

**Rationale**:
- All queries include `WHERE user_id = {authenticated_user_id}` filter
- Foreign key constraint ensures referential integrity: `user_id REFERENCES users(id) ON DELETE CASCADE`
- Simple to implement and understand
- Performs well with proper indexing: `CREATE INDEX idx_tasks_user_id ON tasks(user_id)`
- Works across all database operations (SELECT, UPDATE, DELETE)
- No complex PostgreSQL RLS policies needed at this scale

**Trade-offs**:
- Developer must remember to add user_id filter to all queries (but enforced by code review)
- Slightly less secure than database-level RLS (but sufficient for this application)

**Implementation Pattern**:
```python
# GET all tasks for authenticated user
tasks = session.exec(
    select(Task).where(Task.user_id == current_user.id)
).all()

# UPDATE task only if owned by authenticated user
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
).first()
if not task:
    raise HTTPException(status_code=404, detail="Task not found")
```

**References**:
- PostgreSQL Foreign Keys: https://www.postgresql.org/docs/current/ddl-constraints.html
- Multi-tenancy patterns: https://docs.microsoft.com/en-us/azure/architecture/patterns/sharding

---

### 6. RESTful URL Structure for User-Scoped Resources

**Context**: Task endpoints must clearly indicate user ownership while following REST conventions.

**Options Considered**:
- `/api/tasks` (implicit user from JWT)
- `/api/users/{user_id}/tasks` (explicit user in URL)
- `/api/{user_id}/tasks` (shorter explicit form)
- `/api/v1/tasks` with user filtering

**Decision**: Use `/api/{user_id}/tasks` with user_id validation against authenticated user.

**Rationale**:
- Explicit user context in URL improves API clarity
- Prevents accidental cross-user data access bugs
- Middleware validates `{user_id}` matches authenticated user from JWT
- Shorter than full `/api/users/{user_id}/tasks` path
- Consistent pattern for future user-scoped resources
- Self-documenting API structure

**Trade-offs**:
- Slightly more verbose than implicit filtering
- User ID appears in URL (but already in JWT, not a security issue)

**Endpoint Structure**:
```
GET    /api/{user_id}/tasks              # List all tasks
POST   /api/{user_id}/tasks              # Create task
GET    /api/{user_id}/tasks/{task_id}   # Get single task
PUT    /api/{user_id}/tasks/{task_id}   # Update task
DELETE /api/{user_id}/tasks/{task_id}   # Delete task
PATCH  /api/{user_id}/tasks/{task_id}/complete  # Toggle completion
```

---

### 7. Separate PATCH Endpoint for Toggle Completion

**Context**: Toggling task completion is the most frequent operation and should be optimized for user experience.

**Options Considered**:
- PUT `/api/{user_id}/tasks/{task_id}` with full task update
- PATCH `/api/{user_id}/tasks/{task_id}` with `{completed: true/false}`
- POST `/api/{user_id}/tasks/{task_id}/complete` action-based endpoint
- PATCH `/api/{user_id}/tasks/{task_id}/complete` dedicated toggle endpoint

**Decision**: Implement `PATCH /api/{user_id}/tasks/{task_id}/complete` with no request body (toggles current state).

**Rationale**:
- Optimized for most common operation (meets SC-003: 500ms response)
- No request body needed - backend toggles current `completed` value
- Enables optimistic UI updates on frontend
- Reduces payload size for mobile/slow connections
- Idempotent operation (can safely retry)
- Clear semantic meaning for API consumers

**Trade-offs**:
- Extra endpoint to maintain (but simple logic)
- Deviates slightly from pure REST (but improves UX)

**Implementation**:
```python
@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskRead)
async def toggle_task_completion(
    task_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    validate_user_id(user_id, current_user.id)
    task = get_task_or_404(session, task_id, user_id)
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

---

### 8. Status Filter Query Parameter

**Context**: Users need to view all tasks, only pending tasks, or only completed tasks.

**Options Considered**:
- Separate endpoints: `/api/{user_id}/tasks/pending`, `/api/{user_id}/tasks/completed`
- Query parameter: `/api/{user_id}/tasks?status=pending|completed|all`
- Header-based filtering
- POST request with filter criteria in body

**Decision**: Use query parameter `?status=pending|completed|all` (default: `all`).

**Rationale**:
- RESTful approach using query parameters for filtering
- Single endpoint with optional filter reduces API surface area
- Default `all` ensures backward compatibility
- Frontend can easily change filter without route changes
- Aligns with common REST API patterns (GitHub, Stripe, etc.)
- Supports future expansion: `?status=pending&sort=created_desc`

**Trade-offs**:
- Requires parameter validation on backend
- Slightly more complex query logic than separate endpoints

**API Usage**:
```
GET /api/{user_id}/tasks                  # All tasks
GET /api/{user_id}/tasks?status=pending   # Only pending
GET /api/{user_id}/tasks?status=completed # Only completed
```

---

### 9. Auto-Increment Integer ID vs. UUID for Tasks

**Context**: Tasks need unique identifiers for API operations (GET, PUT, DELETE).

**Options Considered**:
- Auto-increment integer ID (PostgreSQL SERIAL)
- UUID v4 (random)
- ULID (sortable UUID)
- Composite key (user_id + sequence)

**Decision**: Use auto-increment integer ID (PostgreSQL SERIAL).

**Rationale**:
- Simpler for users to reference (e.g., "Task #123" vs. "Task abc-def-...")
- Smaller URL size: `/tasks/42` vs. `/tasks/550e8400-e29b-41d4-a716-446655440000`
- Better database index performance (smaller key size)
- Sequential IDs are sufficient for single-tenant task lists
- No security issue since tasks are already scoped by user_id
- Aligns with Phase 1 implementation (continuity)

**Trade-offs**:
- IDs are predictable (but not a security concern with user_id scoping)
- Cannot distribute ID generation across services (not needed at this scale)
- Potential for user to infer total task count (acceptable for todo app)

**Schema**:
```python
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)  # Auto-increment
    user_id: int = Field(foreign_key="users.id", index=True)
    # ...
```

---

### 10. CASCADE Delete for User-Task Relationship

**Context**: When a user account is deleted, their tasks should also be removed to maintain data integrity.

**Options Considered**:
- `ON DELETE CASCADE` (automatic deletion)
- `ON DELETE SET NULL` (orphan tasks)
- `ON DELETE RESTRICT` (prevent user deletion if tasks exist)
- Application-level deletion in transaction

**Decision**: Implement `ON DELETE CASCADE` foreign key constraint.

**Rationale**:
- Tasks have no meaning without an owner - they should be deleted
- Automatic cleanup reduces application logic complexity
- Prevents orphaned records in database
- Database-level enforcement ensures consistency even if app code changes
- Standard pattern for owned resources in relational databases
- Aligns with GDPR "right to be forgotten" (user data fully removed)

**Trade-offs**:
- Permanent deletion with no recovery (acceptable for todo app)
- Could implement soft delete later if needed (add `deleted_at` column)

**Schema**:
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- ...
);
```

---

### 11. Client-Side Optimistic Updates for Toggle

**Context**: Task completion toggle must feel instant (SC-003: 500ms response) despite network latency.

**Options Considered**:
- Wait for server response before updating UI
- Optimistic update with rollback on error
- Debounce toggle requests
- WebSocket for real-time updates

**Decision**: Implement optimistic updates with error rollback.

**Rationale**:
- UI updates immediately when user clicks toggle (perceived as instant)
- API request sent in background
- If request fails, revert UI state and show error toast
- Dramatically improves perceived performance (meets SC-003)
- Common pattern in modern web apps (Trello, Todoist, etc.)
- Requires no additional infrastructure (unlike WebSockets)

**Trade-offs**:
- Slight complexity in state management (React useState + useEffect)
- User sees "wrong" state if offline (acceptable with error message)

**Implementation Pattern**:
```typescript
const toggleTask = async (taskId: number) => {
  // Optimistic update
  setTasks(tasks.map(t =>
    t.id === taskId ? { ...t, completed: !t.completed } : t
  ));

  try {
    await api.patch(`/api/${userId}/tasks/${taskId}/complete`);
  } catch (error) {
    // Rollback on error
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
    toast.error("Failed to update task");
  }
};
```

---

### 12. React Hook Form for Validation

**Context**: Task creation and editing forms need client-side validation for immediate user feedback.

**Options Considered**:
- Native HTML5 validation (`required`, `maxlength`)
- React Hook Form with zod schema
- Formik + yup validation
- Custom validation hooks

**Decision**: Use React Hook Form with zod schemas.

**Rationale**:
- Excellent TypeScript support with type inference
- zod schemas can match backend Pydantic models
- Minimal re-renders (better performance than Formik)
- Built-in error handling and display
- Meets SC-007: validation feedback within 200ms
- Popular in modern Next.js projects (good community support)

**Trade-offs**:
- Learning curve for developers unfamiliar with React Hook Form
- Adds ~50KB to bundle (acceptable for features gained)

**Usage Example**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(taskSchema),
});
```

---

### 13. No Pagination in Phase 2

**Context**: Task lists could grow large over time, impacting load performance.

**Options Considered**:
- Implement pagination immediately (e.g., 20 tasks per page)
- Infinite scroll with cursor-based pagination
- Virtual scrolling for large lists
- No pagination (load all tasks)

**Decision**: No pagination in Phase 2 - load all tasks for user.

**Rationale**:
- SC-006 requires support for 500 tasks per user without degradation
- Modern browsers handle rendering 500 rows efficiently
- Simpler implementation (no page state management)
- Better user experience for todo app (see all tasks at once)
- Can add pagination in Phase 3+ if needed
- Average user has <100 tasks (based on todo app benchmarks)

**Trade-offs**:
- Potential performance issue if user has 1000+ tasks (but out of scope for Phase 2)
- Initial page load slightly slower than paginated view (but meets SC-002: 2 seconds)

**Future Consideration**:
- Phase 3 could add virtual scrolling (react-window) if needed
- Monitor analytics for users with >500 tasks

---

### 14. Responsive Design with Tailwind CSS

**Context**: Task list must work on mobile (320px) to desktop (1920px) screens (SC-005).

**Options Considered**:
- CSS Grid with media queries
- Tailwind responsive utilities
- CSS-in-JS with styled-components
- Bootstrap grid system

**Decision**: Use Tailwind CSS responsive utilities with mobile-first approach.

**Rationale**:
- Tailwind already in project stack (Phase 2 standard)
- Mobile-first breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Utility classes enable rapid responsive iteration
- No runtime CSS-in-JS overhead
- Consistent design system across app
- Excellent developer experience with VSCode IntelliSense

**Trade-offs**:
- Longer class names in JSX (but improved by Prettier)
- Learning curve for developers unfamiliar with utility-first CSS

**Pattern**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

---

### 15. Database Indexes for Performance

**Context**: Task queries must perform well even with 500 tasks per user (SC-006).

**Options Considered**:
- Index on `user_id` only
- Composite index on `(user_id, created_at)`
- Composite index on `(user_id, completed, created_at)`
- Full-text index on title/description

**Decision**: Create two indexes:
1. `idx_tasks_user_id` on `user_id` (foreign key index)
2. `idx_tasks_user_created` on `(user_id, created_at DESC)`

**Rationale**:
- Index #1 optimizes user_id lookups (all queries filter by user)
- Index #2 optimizes default task list ordering (newest first)
- Composite index reduces query time for common list view
- Neon PostgreSQL benefits from covering indexes
- Minimal impact on INSERT/UPDATE performance
- Supports future sorting options (created_at, updated_at)

**Trade-offs**:
- Slightly slower writes due to index maintenance (negligible for todo app scale)
- Additional storage space (acceptable for performance gain)

**Schema**:
```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
```

---

### 16. Error Handling and User Feedback

**Context**: Users need clear feedback for validation errors, network failures, and operation results.

**Options Considered**:
- Simple alert() dialogs
- Toast notifications (react-hot-toast, sonner)
- Inline error messages only
- Modal dialogs for all errors

**Decision**: Combine inline validation errors (forms) with toast notifications (operations).

**Rationale**:
- Form validation: inline errors below each field (meets SC-007)
- API errors: toast notifications for network/server failures
- Success confirmations: toast for create/update/delete (FR-015)
- Toasts don't block user interaction (non-modal)
- Consistent with modern web app patterns
- Accessibility: ARIA live regions for screen readers

**Trade-offs**:
- Requires toast library dependency (react-hot-toast or sonner)
- Must ensure toasts are accessible (not just visual)

**Usage Pattern**:
```typescript
import toast from 'react-hot-toast';

try {
  await createTask(taskData);
  toast.success("Task created successfully");
} catch (error) {
  toast.error(error.message || "Failed to create task");
}
```

---

## Technology Stack Summary

### Backend
- **Framework**: FastAPI 0.100+
- **ORM**: SQLModel 0.0.14+
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT validation with Better Auth integration
- **Validation**: Pydantic (via SQLModel)

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Form Handling**: React Hook Form 7.x
- **Validation**: Zod 3.x
- **Styling**: Tailwind CSS 3.x
- **Notifications**: react-hot-toast or sonner
- **HTTP Client**: fetch API with custom wrapper

### Development
- **Package Manager (Python)**: UV
- **Package Manager (Node)**: npm or pnpm
- **Database Client**: Neon serverless driver
- **API Testing**: FastAPI auto-generated docs (Swagger UI)

---

## Open Questions & Future Research

### Phase 2 Scope
- Should we add basic keyboard shortcuts (e.g., `Ctrl+N` for new task)?
- Do we need undo/redo for delete operations?
- Should completed tasks auto-archive after 30 days?

### Phase 3 Considerations
- Search/filter by title or description (full-text search)
- Task tags/categories for organization
- Due dates and reminders
- Task prioritization (high/medium/low)
- Bulk operations (select multiple, delete all completed)

### Performance
- Should we implement service worker for offline support?
- Do we need request debouncing for rapid updates?
- Should we add HTTP caching headers for task list?

---

## References

### Documentation
- FastAPI: https://fastapi.tiangolo.com/
- SQLModel: https://sqlmodel.tiangolo.com/
- Next.js: https://nextjs.org/docs
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
- Tailwind CSS: https://tailwindcss.com/
- Better Auth: https://www.better-auth.com/

### Design Patterns
- REST API Design Best Practices: https://restfulapi.net/
- Multi-Tenancy Patterns: https://docs.microsoft.com/en-us/azure/architecture/patterns/
- Optimistic UI Updates: https://www.apollographql.com/docs/react/performance/optimistic-ui/

### Security
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

**Last Updated**: 2025-12-14
**Status**: Complete - Ready for implementation
**Next Step**: Generate tasks with `/sp.tasks`
