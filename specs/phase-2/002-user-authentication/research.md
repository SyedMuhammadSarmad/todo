# Research & Design Decisions: User Authentication

**Feature**: User Authentication
**Branch**: `002-user-authentication`
**Date**: 2025-12-14

## Overview

This document captures research findings and design decisions for implementing user authentication with Better Auth, JWT tokens, and session management in a Next.js + FastAPI application.

## Technical Stack Research

### Decision 1: Better Auth for Frontend Authentication

**Decision**: Use Better Auth library for Next.js frontend authentication

**Rationale**:
- **Native TypeScript Support**: Better Auth is built with TypeScript-first approach, providing excellent type safety
- **JWT Plugin**: Built-in JWT plugin that works seamlessly with both frontend and backend
- **Next.js 16 App Router Compatible**: Designed to work with latest Next.js architecture patterns
- **Minimal Configuration**: Simple setup with sensible defaults
- **Shared Secret Model**: Uses same `BETTER_AUTH_SECRET` across frontend and backend for token verification

**Alternatives Considered**:
- **NextAuth.js**: More mature but heavier, complex adapter model, OAuth-focused
- **Custom JWT Implementation**: More control but requires security expertise and more code
- **Clerk**: Third-party service with vendor lock-in and cost implications

**Implementation Approach**:
- Install `better-auth` npm package in frontend
- Configure with email/password provider
- Enable JWT plugin for token generation
- Store tokens in HTTP-only cookies for security

### Decision 2: JWT Token-Based Session Management

**Decision**: Use JWT (JSON Web Tokens) for stateless session management

**Rationale**:
- **Stateless**: No server-side session storage needed, scales horizontally
- **User Context**: Token payload contains user_id for data isolation
- **Cross-Domain**: Works across frontend (Next.js) and backend (FastAPI)
- **Expiration**: Built-in exp claim for automatic session timeout
- **Performance**: Token validation is fast (cryptographic signature check)

**Token Structure**:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1702512000,
  "exp": 1703116800
}
```

**Alternatives Considered**:
- **Session Cookies with Server Storage**: Requires Redis/database, harder to scale
- **Opaque Tokens**: Requires database lookup on every request, slower

**Security Measures**:
- Tokens signed with HS256 algorithm
- Shared secret minimum 32 characters
- Tokens expire after 7 days (configurable)
- Refresh mechanism for active sessions

### Decision 3: FastAPI JWT Verification Middleware

**Decision**: Implement custom JWT verification middleware for FastAPI backend

**Rationale**:
- **Centralized Validation**: All protected routes automatically verify tokens
- **Dependency Injection**: FastAPI's dependency system makes this elegant
- **User Context Extraction**: Middleware extracts user_id from token and injects into request
- **Path Parameter Validation**: Verify JWT user_id matches URL {user_id} parameter

**Implementation Pattern**:
```python
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError

async def verify_jwt(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]  # user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Alternatives Considered**:
- **Better Auth Backend Library**: Not available for Python, JS/TS only
- **PyJWT**: Lower-level, requires more boilerplate (chosen python-jose instead)
- **OAuth2 Libraries**: Overcomplicated for simple JWT verification

### Decision 4: Database Schema for Users and Sessions

**Decision**: Use Better Auth's managed user table + custom session tracking

**Rationale**:
- **Better Auth User Management**: Better Auth creates and manages the `users` table automatically
- **Password Hashing**: Better Auth handles bcrypt hashing securely
- **Email Validation**: Built-in email format and uniqueness validation
- **Minimal Schema**: Only store what's necessary (email, hashed password, timestamps)

**Database Tables**:

**Users Table** (managed by Better Auth):
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sessions Table** (optional, for audit/revocation):
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(45)
);
```

**Alternatives Considered**:
- **Custom User Management**: More work, higher security risk, reinventing wheel
- **Server-Side Session Store**: Better Auth supports this, but JWT is simpler for our scale
- **No Session Tracking**: JWT alone works, but session table enables revocation/audit

### Decision 5: Rate Limiting for Brute Force Protection

**Decision**: Implement rate limiting middleware in FastAPI backend

**Rationale**:
- **Security Requirement**: FR-013 requires protection against brute force attacks
- **Backend Enforcement**: Frontend rate limiting can be bypassed, backend is authoritative
- **Simple In-Memory Store**: Use Python dict with TTL for rate limit counters
- **IP + Email Based**: Track failed attempts per IP address and per email

**Implementation Approach**:
```python
from collections import defaultdict
from datetime import datetime, timedelta

rate_limit_store = defaultdict(list)

def check_rate_limit(email: str, ip: str):
    key = f"{email}:{ip}"
    now = datetime.utcnow()
    # Clean old attempts
    rate_limit_store[key] = [
        attempt for attempt in rate_limit_store[key]
        if now - attempt < timedelta(minutes=1)
    ]
    # Check limit
    if len(rate_limit_store[key]) >= 5:
        raise HTTPException(429, "Too many attempts")
    rate_limit_store[key].append(now)
```

**Alternatives Considered**:
- **Redis Rate Limiting**: Overkill for initial version, can add later
- **Cloudflare Rate Limiting**: External dependency, adds complexity
- **No Rate Limiting**: Violates security requirements

### Decision 6: HTTPS Enforcement Strategy

**Decision**: Enforce HTTPS in production, allow HTTP in development

**Rationale**:
- **Security Requirement**: FR-026 mandates HTTPS for all authentication
- **Development Convenience**: localhost with HTTPS is cumbersome
- **Deployment Platform Handling**: Vercel (frontend) and most hosting (backend) provide HTTPS by default
- **Environment-Based Configuration**: Use environment variable to control enforcement

**Implementation**:
- **Frontend**: Next.js production builds automatically enforce HTTPS
- **Backend**: FastAPI middleware checks request scheme in production
- **Cookies**: Set `Secure` flag on cookies in production only

### Decision 7: CSRF Protection

**Decision**: Use SameSite cookie attribute + CORS configuration for CSRF protection

**Rationale**:
- **Security Requirement**: FR-027 requires CSRF protection
- **Modern Approach**: SameSite=Strict prevents CSRF attacks on modern browsers
- **CORS Whitelist**: Backend only accepts requests from known frontend origins
- **No CSRF Tokens Needed**: With SameSite cookies + CORS, traditional CSRF tokens unnecessary

**CORS Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)
```

**Cookie Settings**:
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60  // 7 days
}
```

### Decision 8: XSS Protection Strategy

**Decision**: Rely on React's built-in XSS protection + Content Security Policy

**Rationale**:
- **Security Requirement**: FR-027 requires XSS protection
- **React Default Safety**: React escapes all user input by default
- **CSP Headers**: Add Content-Security-Policy headers to prevent inline script injection
- **No Dangerous APIs**: Avoid `dangerouslySetInnerHTML` in authentication flows

**CSP Header** (Next.js middleware):
```typescript
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

## API Design Research

### Decision 9: RESTful API Endpoint Structure

**Decision**: Use resource-based URLs with user context in path

**Rationale**:
- **Constitution Compliance**: Follows API design principles in constitution
- **Explicit User Context**: `/api/auth/{user_id}/...` makes authorization clear
- **RESTful Conventions**: Standard HTTP methods (POST, GET, DELETE)

**Endpoints**:
```
POST   /api/auth/signup              Create new user account
POST   /api/auth/signin              Authenticate existing user
POST   /api/auth/signout             Terminate session
GET    /api/auth/session             Verify current session
POST   /api/auth/refresh             Refresh expiring token
```

**Alternatives Considered**:
- **GraphQL**: Overkill for simple auth operations
- **RPC-style**: Less RESTful, harder to cache
- **No user_id in path**: Less explicit, but acceptable for auth endpoints

### Decision 10: Password Requirements

**Decision**: Minimum 8 characters, at least one letter and one number

**Rationale**:
- **Specified in Spec**: FR-003 explicitly defines these requirements
- **Balance Security and UX**: Strong enough to prevent dictionary attacks, simple enough for users
- **No Special Characters Required**: Reduces user frustration without major security impact
- **Better Auth Validation**: Easily configurable in Better Auth password provider

**Validation Logic**:
```typescript
function validatePassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}
```

**Alternatives Considered**:
- **NIST Guidelines**: Recommends longer passwords but no complexity, considered too lenient
- **Strict Requirements**: Special chars, uppercase/lowercase - considered too complex

## Session Management Research

### Decision 11: Session Expiration Strategy

**Decision**: 7-day expiration with 24-hour inactivity timeout

**Rationale**:
- **Specified in Spec**: FR-016 (7 days persistence) and FR-017 (24h inactivity)
- **Balance Convenience and Security**: Week-long sessions convenient, inactivity timeout protects abandoned sessions
- **Token Refresh**: Automatically refresh tokens on activity to extend 7-day window

**Implementation**:
- JWT `exp` claim set to 7 days from issue
- Frontend tracks last activity timestamp in localStorage
- On API request, if last activity > 24h ago, force re-authentication
- Active users get token refreshed automatically

**Alternatives Considered**:
- **Sliding Sessions**: More complex, refresh on every request (performance impact)
- **Fixed Sessions**: No inactivity timeout (less secure)

### Decision 12: Multi-Device Session Strategy

**Decision**: Allow concurrent sessions with independent expiration

**Rationale**:
- **Specified in Spec**: FR-020 requires concurrent device support
- **User Expectation**: Users expect to stay signed in on phone and laptop simultaneously
- **Stateless JWT**: Each device has its own JWT, no central session store needed

**Implementation**:
- Each signin creates a new JWT
- No session invalidation across devices
- Signout only clears token on current device

**Alternatives Considered**:
- **Single Session**: Better security but poor UX, not required
- **Session Store**: Track all sessions in database for revocation (future enhancement)

## Frontend Implementation Research

### Decision 13: Next.js App Router Auth Pattern

**Decision**: Use React Server Components for auth checks, Client Components for forms

**Rationale**:
- **App Router Best Practice**: Server Components handle auth checks server-side
- **Performance**: Initial page load includes auth state, no client-side check delay
- **Security**: Auth logic runs on server, harder to bypass

**Pattern**:
```typescript
// app/tasks/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect('/signin');

  return <TaskList />;
}

// components/SigninForm.tsx (Client Component)
'use client';
export function SigninForm() {
  // Form logic with useState, onSubmit
}
```

**Alternatives Considered**:
- **Client-Side Only Auth**: Slower, flash of unauthenticated content
- **Middleware Auth**: Better Auth supports this, can add later

### Decision 14: Error Handling and User Feedback

**Decision**: Use toast notifications for auth errors, inline validation for forms

**Rationale**:
- **User Experience**: Immediate feedback without page navigation
- **Accessibility**: Toast notifications can be screen-reader friendly
- **Form Validation**: Real-time validation before submission reduces errors

**Libraries**:
- **sonner** or **react-hot-toast** for toast notifications
- **react-hook-form** for form validation
- **zod** for schema validation (matches backend)

## Testing Strategy Research

### Decision 15: Authentication Testing Approach

**Decision**: Unit tests for utilities, integration tests for API endpoints, E2E for user flows

**Test Coverage**:
- **Backend Unit Tests**: JWT creation, validation, password hashing
- **Backend Integration Tests**: API endpoints with test database
- **Frontend Unit Tests**: Form validation, helper functions
- **Frontend Integration Tests**: Component interaction with React Testing Library
- **E2E Tests**: Full signup → signin → signout flow with Playwright/Cypress

**Key Test Scenarios**:
1. Successful signup with valid credentials
2. Signup rejection for duplicate email
3. Successful signin with correct credentials
4. Signin rejection for wrong password
5. Signin rejection for non-existent email
6. Session persistence across page reloads
7. Session expiration after inactivity
8. Signout clears session
9. Protected routes redirect when unauthenticated
10. Rate limiting blocks after 5 failed attempts

## Environment Configuration Research

### Decision 16: Environment Variable Strategy

**Decision**: Use separate .env files for frontend and backend with shared secrets

**Required Variables**:

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
BETTER_AUTH_SECRET=your-secret-min-32-chars
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
ENVIRONMENT=development
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

**Security Notes**:
- `.env` files must be in `.gitignore`
- Provide `.env.example` templates in repo
- Document in quickstart.md
- Use same `BETTER_AUTH_SECRET` in both frontend and backend

## Risk Analysis

### Risk 1: Better Auth Compatibility with FastAPI Backend

**Risk**: Better Auth is JavaScript/TypeScript library, FastAPI is Python

**Mitigation**:
- Better Auth uses standard JWT tokens
- Python `python-jose` library can verify JWT tokens
- Shared secret model works across languages
- Test integration thoroughly before implementation

### Risk 2: Session Refresh Complexity

**Risk**: Implementing token refresh without disrupting user experience

**Mitigation**:
- Start with simple 7-day fixed expiration
- Add refresh logic only if needed
- Better Auth has built-in refresh token support

### Risk 3: HTTPS Development Setup

**Risk**: Local HTTPS setup for development is complex

**Mitigation**:
- Allow HTTP in development environment
- Document HTTPS requirement for production
- Test HTTPS in staging before production deploy

## Implementation Checklist

- [ ] Install Better Auth in frontend
- [ ] Configure Better Auth email/password provider
- [ ] Set up JWT plugin in Better Auth
- [ ] Create Better Auth API route in Next.js
- [ ] Implement FastAPI JWT verification middleware
- [ ] Create authentication endpoints in FastAPI
- [ ] Set up CORS middleware
- [ ] Implement rate limiting
- [ ] Create signup page/component
- [ ] Create signin page/component
- [ ] Add signout functionality
- [ ] Implement protected route wrapper
- [ ] Add session persistence logic
- [ ] Set up error handling and notifications
- [ ] Write backend authentication tests
- [ ] Write frontend authentication tests
- [ ] Document environment variables
- [ ] Create quickstart guide

## References

- [Better Auth Documentation](https://www.better-auth.com/)
- [FastAPI Security Guide](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js 16 App Router Auth](https://nextjs.org/docs/app/building-your-application/authentication)
