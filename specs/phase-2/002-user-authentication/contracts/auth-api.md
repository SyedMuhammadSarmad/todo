# Authentication API Contract

**Feature**: User Authentication
**Branch**: `002-user-authentication`
**Date**: 2025-12-14
**Base URL**: `/api/auth`

## Overview

This document defines the REST API contract for authentication operations including signup, signin, signout, and session management.

## Common Specifications

### Authentication Header

Protected endpoints require JWT token in Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Standard Error Response

All endpoints use this error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional context
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request (signin, session check) |
| 201 | Created | Resource created (signup) |
| 400 | Bad Request | Invalid input (validation errors) |
| 401 | Unauthorized | Missing or invalid token |
| 409 | Conflict | Resource already exists (duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## API Endpoints Summary

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/auth/signup` | No | Create new user account |
| POST | `/api/auth/signin` | No | Authenticate existing user |
| POST | `/api/auth/signout` | Yes | Terminate current session |
| GET | `/api/auth/session` | Yes | Verify session and get user info |

## Endpoint Details

### 1. POST /api/auth/signup

Create a new user account with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (201)**:
```json
{
  "user": {
    "id": "usr_1a2b3c4d5e6f",
    "email": "user@example.com",
    "createdAt": "2025-12-14T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-21T10:30:00Z"
}
```

**Error Responses**:
- 400: Invalid email format or weak password
- 409: Email already exists

### 2. POST /api/auth/signin

Authenticate an existing user with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200)**:
```json
{
  "user": {
    "id": "usr_1a2b3c4d5e6f",
    "email": "user@example.com",
    "createdAt": "2025-12-10T08:00:00Z",
    "lastSigninAt": "2025-12-14T10:35:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-21T10:35:00Z"
}
```

**Error Responses**:
- 401: Invalid email or password
- 429: Too many signin attempts

### 3. POST /api/auth/signout

Terminate the current user session.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Success Response (200)**:
```json
{
  "message": "Signed out successfully"
}
```

**Error Responses**:
- 401: Missing or invalid token

### 4. GET /api/auth/session

Check if current token is valid and get user info.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Success Response (200)**:
```json
{
  "user": {
    "id": "usr_1a2b3c4d5e6f",
    "email": "user@example.com",
    "createdAt": "2025-12-10T08:00:00Z",
    "lastSigninAt": "2025-12-14T10:35:00Z"
  },
  "expiresAt": "2025-12-21T10:35:00Z",
  "isActive": true
}
```

**Error Responses**:
- 401: Invalid or expired token

## Full API specification with schemas, validation rules, and code examples is available in the detailed contract document.
