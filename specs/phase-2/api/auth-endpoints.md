# Authentication Endpoints

**Phase**: Phase 2
**Feature**: User Authentication (002-user-authentication)
**Created**: 2025-12-14

## Overview

Authentication endpoints for user signup, signin, signout, and session management using Better Auth (frontend) and JWT verification (backend).

## Base URL

```
/api/auth
```

## Endpoints

### POST /api/auth/signup
Create new user account with email and password.

- **Auth Required**: No
- **Rate Limited**: Yes (5 requests/minute)
- **Request**: `{ email, password }`
- **Response (201)**: `{ user, token, expiresAt }`
- **Errors**: 400 (validation), 409 (duplicate email)

### POST /api/auth/signin
Authenticate existing user credentials.

- **Auth Required**: No
- **Rate Limited**: Yes (5 requests/minute)
- **Request**: `{ email, password }`
- **Response (200)**: `{ user, token, expiresAt }`
- **Errors**: 401 (invalid credentials), 429 (rate limit)

### POST /api/auth/signout
Terminate current user session.

- **Auth Required**: Yes (JWT Bearer token)
- **Request**: Empty body `{}`
- **Response (200)**: `{ message }`
- **Errors**: 401 (invalid/missing token)

### GET /api/auth/session
Verify session and retrieve user information.

- **Auth Required**: Yes (JWT Bearer token)
- **Response (200)**: `{ user, expiresAt, isActive }`
- **Errors**: 401 (invalid/expired token)

## Common Patterns

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>  # For protected endpoints
```

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### JWT Token Format
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1702512000,
  "exp": 1703116800
}
```

## Security

- HTTPS enforced in production
- Passwords hashed with bcrypt
- Rate limiting on auth endpoints
- Generic error messages (don't reveal if email exists)
- CORS whitelist for known origins
- JWT tokens expire after 7 days
- Session timeout after 24h inactivity

## Related Documentation

- **Detailed Contract**: `specs/phase-2/002-user-authentication/contracts/auth-api.md`
- **Data Models**: `specs/phase-2/002-user-authentication/data-model.md`
- **Research & Decisions**: `specs/phase-2/002-user-authentication/research.md`
