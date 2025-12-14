"""Authentication router with signup, signin, signout, and session endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os

from ..models.user import User, UserCreate, UserRead, AuthResponse
from ..utils.password import hash_password, verify_password
from ..utils.jwt import create_access_token, get_token_expiration
from ..middleware.rate_limit import check_rate_limit, clear_rate_limit
from ..dependencies import get_current_user
from ..database import get_session

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Get JWT expiration from environment
JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", "7"))


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    session: Session = Depends(get_session),
) -> AuthResponse:
    """
    Create a new user account (User Story 1).

    - Validates email format and password complexity
    - Checks for duplicate email
    - Hashes password securely with bcrypt
    - Creates user record in database
    - Returns user data and JWT token
    """
    try:
        # T030: Check for duplicate email
        statement = select(User).where(User.email == user_data.email)
        existing_user = session.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists"
            )

        # T031: Hash password using bcrypt
        password_hash = hash_password(user_data.password)

        # T032: Create user record with generated ID
        user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            password_hash=password_hash,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        session.add(user)
        session.commit()
        session.refresh(user)

        # T033: Generate JWT token
        token = create_access_token(user.id)

        # Calculate token expiration
        expires_at = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)

        # T034: Return 201 Created with user data and JWT token
        return AuthResponse(
            user=UserRead(
                id=user.id,
                email=user.email,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_signin_at=user.last_signin_at,
            ),
            token=token,
            expires_at=expires_at,
        )

    except HTTPException:
        # Re-raise HTTP exceptions (like 409 Conflict)
        raise
    except Exception as e:
        # T035: Handle database errors and validation failures
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating your account: {str(e)}"
        )
