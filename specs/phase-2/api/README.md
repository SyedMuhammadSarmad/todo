# API Specifications

API endpoint specifications defining the contract between frontend and backend.

## Purpose

API specs define the **interface** for all backend endpoints, including:
- Request/response models
- HTTP methods and status codes
- Authentication requirements
- Error responses

## Files to Create

- **rest-endpoints.md**: Complete RESTful API specification
  - GET `/api/{user_id}/tasks` - List all tasks
  - POST `/api/{user_id}/tasks` - Create new task
  - GET `/api/{user_id}/tasks/{id}` - Get task details
  - PUT `/api/{user_id}/tasks/{id}` - Update task
  - DELETE `/api/{user_id}/tasks/{id}` - Delete task
  - PATCH `/api/{user_id}/tasks/{id}/complete` - Toggle completion

## Specification Format

Each endpoint should document:

1. **HTTP Method & Path**
2. **Authentication**: Required JWT token
3. **Path Parameters**: e.g., `{user_id}`, `{id}`
4. **Query Parameters**: e.g., `?status=pending`
5. **Request Body**: JSON schema with Pydantic models
6. **Response Body**: Success response schema
7. **Status Codes**: 200, 201, 400, 401, 404, 500
8. **Error Responses**: Standard error format

## Example

```markdown
### GET /api/{user_id}/tasks

List all tasks for the authenticated user.

**Authentication**: Required (JWT Bearer token)

**Path Parameters**:
- `user_id` (string): User identifier from JWT

**Query Parameters**:
- `status` (optional): Filter by "all" | "pending" | "completed"
- `sort` (optional): Sort by "created" | "title" | "updated"

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2025-12-11T10:00:00Z",
      "updated_at": "2025-12-11T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User ID in path doesn't match JWT user
```

---

**Status**: 📝 To be created via `/sp.specify`
**Related**: See `../features/` for user stories, `../database/` for data models
