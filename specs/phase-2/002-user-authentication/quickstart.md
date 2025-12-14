# Quickstart Guide: User Authentication

**Feature**: User Authentication
**Branch**: `002-user-authentication`
**Date**: 2025-12-14

## Overview

This guide provides step-by-step instructions to implement user authentication with signup, signin, signout, and session management for the Todo application.

## Prerequisites

- Node.js 18+ installed
- Python 3.13+ installed
- UV package manager installed
- PostgreSQL database (Neon account)
- Git repository initialized
- Editor with TypeScript support

## Architecture Overview

```
┌─────────────┐         JWT Token          ┌─────────────┐
│   Next.js   │◄─────────────────────────►│   FastAPI   │
│  (Frontend) │    Authorization Header    │  (Backend)  │
│             │                             │             │
│ Better Auth │                             │ JWT Verify  │
└─────────────┘                             └──────┬──────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Neon       │
                                            │  PostgreSQL │
                                            │             │
                                            │ users table │
                                            └─────────────┘
```

## Project Setup

### 1. Environment Configuration

**Backend** (`backend/.env`):
```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname

# Auth
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
ENVIRONMENT=development
```

**Frontend** (`frontend/.env.local`):
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Auth
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Environment
NEXT_PUBLIC_APP_ENV=development
```

**Important**: Use the SAME `BETTER_AUTH_SECRET` in both files!

### 2. Generate Secret Key

```bash
# Generate a secure random secret (32+ characters)
openssl rand -base64 32
```

## Backend Implementation

### Step 1: Install Dependencies

```bash
cd backend
uv pip install fastapi uvicorn[standard] sqlmodel psycopg2-binary python-jose[cryptography] passlib[bcrypt] python-multipart
```

### Step 2: Database Models

Create `backend/src/models/user.py`:

```python
from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=255)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_signin_at: Optional[datetime] = None
```

### Step 3: JWT Utilities

Create `backend/src/auth/jwt.py`:

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
import os

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

def create_jwt_token(user_id: str, email: str) -> dict:
    """Create JWT token for authenticated user"""
    expires_at = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": expires_at
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "expires_at": expires_at}

async def verify_jwt(authorization: str = Header(...)) -> str:
    """Verify JWT token and return user_id"""
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
```

### Step 4: Password Hashing

Create `backend/src/auth/password.py`:

```python
from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def validate_password(password: str) -> tuple[bool, list[str]]:
    """Validate password meets requirements"""
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if not re.search(r'[a-zA-Z]', password):
        errors.append("Password must contain at least one letter")
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    return (len(errors) == 0, errors)
```

### Step 5: Auth Endpoints

Create `backend/src/api/auth.py`:

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from src.models.user import User
from src.auth.jwt import create_jwt_token, verify_jwt
from src.auth.password import hash_password, verify_password, validate_password
import uuid

router = APIRouter(prefix="/api/auth")

# Request/Response Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class SigninRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user: dict
    token: str
    expires_at: str

# Endpoints
@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Validate password
    is_valid, errors = validate_password(request.password)
    if not is_valid:
        raise HTTPException(400, detail={"code": "INVALID_PASSWORD", "errors": errors})

    # Check if email exists
    existing = db.exec(select(User).where(User.email == request.email)).first()
    if existing:
        raise HTTPException(409, detail={"code": "EMAIL_EXISTS", "message": "Email already registered"})

    # Create user
    user = User(
        id=f"usr_{uuid.uuid4().hex[:12]}",
        email=request.email,
        password_hash=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token_data = create_jwt_token(user.id, user.email)

    return {
        "user": {"id": user.id, "email": user.email, "createdAt": user.created_at.isoformat()},
        "token": token_data["token"],
        "expires_at": token_data["expires_at"].isoformat()
    }

@router.post("/signin", response_model=AuthResponse)
async def signin(request: SigninRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(401, detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"})

    # Update last signin
    user.last_signin_at = datetime.utcnow()
    db.commit()

    # Generate token
    token_data = create_jwt_token(user.id, user.email)

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "createdAt": user.created_at.isoformat(),
            "lastSigninAt": user.last_signin_at.isoformat()
        },
        "token": token_data["token"],
        "expires_at": token_data["expires_at"].isoformat()
    }

@router.post("/signout")
async def signout(user_id: str = Depends(verify_jwt)):
    # With stateless JWT, signout is handled client-side
    return {"message": "Signed out successfully"}

@router.get("/session")
async def get_session(user_id: str = Depends(verify_jwt), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "createdAt": user.created_at.isoformat(),
            "lastSigninAt": user.last_signin_at.isoformat() if user.last_signin_at else None
        },
        "isActive": True
    }
```

### Step 6: CORS Middleware

In `backend/src/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS
allowed_origins = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
from src.api.auth import router as auth_router
app.include_router(auth_router)
```

## Frontend Implementation

### Step 1: Install Dependencies

```bash
cd frontend
npm install better-auth
npm install sonner  # For toast notifications
```

### Step 2: Better Auth Configuration

Create `frontend/lib/auth-config.ts`:

```typescript
import { BetterAuth } from "better-auth";

export const auth = new BetterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  providers: {
    credentials: {
      enabled: true,
    },
  },
  jwt: {
    enabled: true,
    expiresIn: "7d",
  },
});
```

### Step 3: API Client

Create `frontend/lib/api/auth.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function signup(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Signup failed');
  }

  return response.json();
}

export async function signin(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Signin failed');
  }

  return response.json();
}

export async function signout(token: string) {
  await fetch(`${API_BASE}/api/auth/signout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
```

### Step 4: Signup Page

Create `frontend/app/signup/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/api/auth';
import { toast } from 'sonner';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { token } = await signup(email, password);
      localStorage.setItem('auth_token', token);
      toast.success('Account created!');
      router.push('/tasks');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 5: Signin Page

Create `frontend/app/signin/page.tsx` (similar structure to signup)

## Testing

### Backend Tests

```bash
cd backend
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd frontend
npm test -- auth
```

### Manual Testing Checklist

- [ ] Can create new account with valid email/password
- [ ] Cannot create account with duplicate email
- [ ] Cannot create account with weak password
- [ ] Can sign in with correct credentials
- [ ] Cannot sign in with wrong password
- [ ] Cannot sign in with non-existent email
- [ ] Token persists across page reloads
- [ ] Protected routes redirect to signin when not authenticated
- [ ] Can sign out successfully

## Running the Application

### Terminal 1: Backend

```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

### Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Troubleshooting

### "Invalid token" errors

- Verify `BETTER_AUTH_SECRET` is identical in both .env files
- Check token format: should be `Bearer <token>`
- Verify token hasn't expired (7 days)

### CORS errors

- Check `CORS_ORIGINS` includes frontend URL
- Verify frontend is running on allowed origin
- Check browser console for specific CORS error

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check Neon database is accessible
- Run migrations if needed

## Next Steps

- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Implement session revocation (sessions table)
- [ ] Add social authentication (Google, GitHub)
- [ ] Implement MFA (two-factor authentication)

## Related Documentation

- **Feature Spec**: `specs/phase-2/features/authentication.md`
- **Research**: `specs/phase-2/002-user-authentication/research.md`
- **Data Model**: `specs/phase-2/002-user-authentication/data-model.md`
- **API Contract**: `specs/phase-2/002-user-authentication/contracts/auth-api.md`
