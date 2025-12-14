# API Contract: Task CRUD Endpoints

**Feature**: Task CRUD Operations
**Branch**: `001-task-crud`
**Date**: 2025-12-14
**Base URL**: `/api/{user_id}/tasks`
**Authentication**: JWT Bearer Token (required for all endpoints)

## Overview

This document defines the complete API contract for task management operations. All endpoints require JWT authentication and enforce strict user isolation - users can only access their own tasks.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

The `{user_id}` in the URL path MUST match the `sub` claim in the JWT token. If they don't match, the server responds with `403 Forbidden`.

## Endpoints Summary

| Method | Endpoint                                     | Description                |
|--------|----------------------------------------------|----------------------------|
| GET    | `/api/{user_id}/tasks`                       | List all user tasks        |
| POST   | `/api/{user_id}/tasks`                       | Create a new task          |
| GET    | `/api/{user_id}/tasks/{task_id}`             | Get a specific task        |
| PUT    | `/api/{user_id}/tasks/{task_id}`             | Update a task              |
| PATCH  | `/api/{user_id}/tasks/{task_id}/complete`    | Toggle task completion     |
| DELETE | `/api/{user_id}/tasks/{task_id}`             | Delete a task              |

---

## 1. List All Tasks

Retrieve all tasks for the authenticated user, optionally filtered by completion status.

### Request

```http
GET /api/{user_id}/tasks?status={status}
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)

**Query Parameters**:
- `status` (string, optional): Filter by task status
  - Values: `all` | `pending` | `completed`
  - Default: `all`

### Response

**Success (200 OK)**:

```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": 123,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2025-12-14T10:30:00Z",
      "updated_at": "2025-12-14T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 123,
      "title": "Finish project",
      "description": null,
      "completed": true,
      "created_at": "2025-12-13T09:15:00Z",
      "updated_at": "2025-12-14T11:00:00Z"
    }
  ],
  "total": 2
}
```

**Response Fields**:
- `tasks` (array): List of task objects
- `total` (integer): Total number of tasks returned

**Task Object**:
- `id` (integer): Unique task identifier
- `user_id` (integer): Owner's user ID
- `title` (string): Task title (1-200 chars)
- `description` (string | null): Optional description (max 1000 chars)
- `completed` (boolean): Completion status
- `created_at` (string): ISO 8601 timestamp
- `updated_at` (string): ISO 8601 timestamp

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**400 Bad Request** (invalid status parameter):
```json
{
  "detail": "Invalid status parameter. Must be 'all', 'pending', or 'completed'."
}
```

### Examples

**Get all tasks**:
```bash
curl -X GET "https://api.example.com/api/123/tasks" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Get only pending tasks**:
```bash
curl -X GET "https://api.example.com/api/123/tasks?status=pending" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Get only completed tasks**:
```bash
curl -X GET "https://api.example.com/api/123/tasks?status=completed" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 2. Create a New Task

Create a new task for the authenticated user.

### Request

```http
POST /api/{user_id}/tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false
}
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)

**Request Body**:
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "completed": "boolean (optional, default: false)"
}
```

### Response

**Success (201 Created)**:

```json
{
  "id": 3,
  "user_id": 123,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2025-12-14T12:00:00Z",
  "updated_at": "2025-12-14T12:00:00Z"
}
```

**Response Headers**:
```http
Location: /api/123/tasks/3
```

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**422 Unprocessable Entity** (validation error - title missing):
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**422 Unprocessable Entity** (validation error - title too long):
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "ensure this value has at most 200 characters",
      "type": "value_error.any_str.max_length",
      "ctx": {"limit_value": 200}
    }
  ]
}
```

**422 Unprocessable Entity** (validation error - description too long):
```json
{
  "detail": [
    {
      "loc": ["body", "description"],
      "msg": "ensure this value has at most 1000 characters",
      "type": "value_error.any_str.max_length",
      "ctx": {"limit_value": 1000}
    }
  ]
}
```

### Examples

**Create a task with title only**:
```bash
curl -X POST "https://api.example.com/api/123/tasks" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**Create a task with title and description**:
```bash
curl -X POST "https://api.example.com/api/123/tasks" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
  }'
```

---

## 3. Get a Specific Task

Retrieve a single task by ID.

### Request

```http
GET /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)
- `task_id` (integer, required): Task ID

### Response

**Success (200 OK)**:

```json
{
  "id": 1,
  "user_id": 123,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2025-12-14T10:30:00Z",
  "updated_at": "2025-12-14T10:30:00Z"
}
```

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**404 Not Found** (task doesn't exist or doesn't belong to user):
```json
{
  "detail": "Task not found"
}
```

### Examples

```bash
curl -X GET "https://api.example.com/api/123/tasks/1" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 4. Update a Task

Update one or more fields of an existing task. This is a full replacement (PUT), not a partial update.

### Request

```http
PUT /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Buy groceries and cook dinner",
  "description": "Milk, eggs, bread, chicken",
  "completed": false
}
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)
- `task_id` (integer, required): Task ID

**Request Body**:
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "completed": "boolean (optional)"
}
```

**Note**: All fields are required in PUT request. For partial updates, use PATCH endpoint.

### Response

**Success (200 OK)**:

```json
{
  "id": 1,
  "user_id": 123,
  "title": "Buy groceries and cook dinner",
  "description": "Milk, eggs, bread, chicken",
  "completed": false,
  "created_at": "2025-12-14T10:30:00Z",
  "updated_at": "2025-12-14T13:45:00Z"
}
```

**Note**: `updated_at` timestamp is automatically updated.

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**404 Not Found** (task doesn't exist or doesn't belong to user):
```json
{
  "detail": "Task not found"
}
```

**422 Unprocessable Entity** (validation error):
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Examples

**Update task title and description**:
```bash
curl -X PUT "https://api.example.com/api/123/tasks/1" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries and cook dinner",
    "description": "Milk, eggs, bread, chicken",
    "completed": false
  }'
```

---

## 5. Toggle Task Completion

Toggle the completion status of a task. This is a dedicated endpoint for the most frequent operation.

### Request

```http
PATCH /api/{user_id}/tasks/{task_id}/complete
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)
- `task_id` (integer, required): Task ID

**Request Body**: None (endpoint toggles current state)

### Response

**Success (200 OK)**:

```json
{
  "id": 1,
  "user_id": 123,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": true,
  "created_at": "2025-12-14T10:30:00Z",
  "updated_at": "2025-12-14T14:00:00Z"
}
```

**Note**:
- `completed` value is toggled (false → true, or true → false)
- `updated_at` timestamp is automatically updated

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**404 Not Found** (task doesn't exist or doesn't belong to user):
```json
{
  "detail": "Task not found"
}
```

### Examples

**Toggle task completion**:
```bash
curl -X PATCH "https://api.example.com/api/123/tasks/1/complete" \
  -H "Authorization: Bearer eyJhbGc..."
```

### Idempotency

This endpoint is idempotent - calling it twice will toggle back to the original state. Frontend should implement optimistic updates for best UX.

---

## 6. Delete a Task

Permanently delete a task.

### Request

```http
DELETE /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `user_id` (integer, required): User ID (must match JWT subject)
- `task_id` (integer, required): Task ID

### Response

**Success (204 No Content)**:

No response body. HTTP status 204 indicates successful deletion.

### Error Responses

**401 Unauthorized** (missing or invalid JWT):
```json
{
  "detail": "Invalid authentication credentials"
}
```

**403 Forbidden** (user_id doesn't match JWT):
```json
{
  "detail": "Access denied: user_id does not match authenticated user"
}
```

**404 Not Found** (task doesn't exist or doesn't belong to user):
```json
{
  "detail": "Task not found"
}
```

### Examples

**Delete a task**:
```bash
curl -X DELETE "https://api.example.com/api/123/tasks/1" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Important**: This operation is permanent. There is no undo/recovery mechanism in Phase 2.

---

## Common Response Codes

| Code | Status                  | Description                                      |
|------|-------------------------|--------------------------------------------------|
| 200  | OK                      | Successful GET, PUT, or PATCH request            |
| 201  | Created                 | Successful POST request (task created)           |
| 204  | No Content              | Successful DELETE request                        |
| 400  | Bad Request             | Invalid query parameters or malformed request    |
| 401  | Unauthorized            | Missing, invalid, or expired JWT token           |
| 403  | Forbidden               | user_id doesn't match authenticated user         |
| 404  | Not Found               | Task doesn't exist or doesn't belong to user     |
| 422  | Unprocessable Entity    | Validation error (invalid field values)          |
| 500  | Internal Server Error   | Server-side error (should be logged and monitored)|

---

## Error Response Format

All errors follow FastAPI's standard error format:

### Single Error
```json
{
  "detail": "Error message string"
}
```

### Validation Errors (422)
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "error message",
      "type": "error_type",
      "ctx": {"additional": "context"}
    }
  ]
}
```

**Fields**:
- `loc`: Location of error (e.g., ["body", "title"])
- `msg`: Human-readable error message
- `type`: Error type identifier
- `ctx`: Additional context (optional)

---

## Rate Limiting

**Phase 2**: No rate limiting implemented.

**Future (Phase 3+)**: Consider implementing:
- 100 requests per minute per user
- 429 Too Many Requests response when exceeded

---

## CORS Configuration

**Development**: Allow all origins (`*`)
**Production**: Restrict to frontend domain only

```python
# FastAPI CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Update for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## Versioning

**Current Version**: No versioning (implicit v1)

**Future**: If breaking changes needed, use URL versioning:
- `/api/v2/{user_id}/tasks`

---

## Testing the API

### Using FastAPI Swagger UI

Navigate to `http://localhost:8000/docs` to access interactive API documentation where you can:
1. Authenticate with JWT token
2. Test all endpoints
3. View request/response schemas
4. See validation errors in real-time

### Using cURL

See examples above in each endpoint section.

### Using Postman/Insomnia

1. Create a new request collection
2. Add `Authorization` header with Bearer token
3. Import OpenAPI schema from `/openapi.json`

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Tokens should expire after reasonable time (e.g., 1 hour)
- Refresh token mechanism should be implemented separately

### Authorization
- Server MUST validate `user_id` in URL matches JWT `sub` claim
- Never trust client-provided `user_id` without validation
- Database queries MUST filter by authenticated user_id

### Input Validation
- All input validated by Pydantic schemas
- SQL injection prevented by SQLModel ORM
- XSS prevention: sanitize user input if rendering in HTML

### Data Isolation
- Tasks are strictly isolated per user
- No endpoints expose other users' data
- Foreign key constraints enforce referential integrity

---

## Performance Requirements

| Operation       | Target      | Constraint                                |
|-----------------|-------------|-------------------------------------------|
| List tasks      | < 2 seconds | Initial page load (SC-002)                |
| Create task     | < 15 seconds| End-to-end user flow (SC-001)             |
| Toggle complete | < 500ms     | UI update latency (SC-003)                |
| Update task     | < 1 second  | Form submission to confirmation           |
| Delete task     | < 1 second  | Confirmation to completion (SC-008)       |

**Note**: Frontend should implement optimistic updates for toggle and delete to meet UX requirements.

---

## Change Log

| Date       | Version | Changes                                      |
|------------|---------|----------------------------------------------|
| 2025-12-14 | 1.0     | Initial API contract for task CRUD operations|

---

**Status**: Complete - Ready for implementation
**Next Step**: Review quickstart.md for step-by-step implementation guide
**Dependencies**: JWT authentication middleware, User model/table
