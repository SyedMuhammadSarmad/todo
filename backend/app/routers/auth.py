"""Authentication router with signup, signin, signout, and session endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os

from ..models.user import User, UserCreate, UserRead, AuthResponse, SigninRequest
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


@router.post("/signin", response_model=AuthResponse)
async def signin(
    signin_data: SigninRequest,
    session: Session = Depends(get_session),
) -> AuthResponse:
    """
    Signin with existing credentials (User Story 2).

    - Validates email and password
    - Rate limits signin attempts (5/minute per email)
    - Returns generic error for invalid credentials
    - Updates last_signin_at timestamp
    - Returns user data and JWT token
    """
    try:
        # T055: Apply rate limiting (5 attempts/minute per email)
        check_rate_limit(signin_data.email)

        # T051: Query database for user by email
        statement = select(User).where(User.email == signin_data.email)
        user = session.exec(statement).first()

        # T052: Return generic 401 if user not found (don't reveal email doesn't exist)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # T053: Verify password using verify_password utility
        if not verify_password(signin_data.password, user.password_hash):
            # T054: Return generic 401 if password incorrect
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # T057: Update user's last_signin_at timestamp
        user.last_signin_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        session.add(user)
        session.commit()
        session.refresh(user)

        # Clear rate limit on successful signin
        clear_rate_limit(signin_data.email)

        # T058: Generate JWT token with user ID and expiration (7 days)
        token = create_access_token(user.id)

        # Calculate token expiration
        expires_at = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)

        # T060: Return 200 OK with user data and JWT token
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
        # Re-raise HTTP exceptions (401, 429, etc.)
        raise
    except Exception as e:
        # T061: Handle database errors
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during signin: {str(e)}"
        )


@router.post("/signout")
async def signout(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Signout - End the current session (User Story 3).

    - Requires valid JWT token
    - Session is terminated on client side (stateless JWT)
    - Returns success message
    """
    # T079: Return success message
    # Note: With stateless JWT, the actual token invalidation happens on the client
    # by removing the token from localStorage. We could optionally track sessions
    # in the database and invalidate them here.
    return {
        "message": "Signed out successfully",
        "user_id": current_user.id,
    }


class SessionResponse(SQLModel):
    """Schema for session check response."""

    user: UserRead
    expires_at: datetime
    is_active: bool = True


@router.get("/session", response_model=SessionResponse)
async def get_session(
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """
    Check session validity (User Story 4).

    - Validates JWT token
    - Returns user data if session is valid
    - Returns 401 if token is expired or invalid
    """
    try:
        # T106: User is already validated by get_current_user dependency
        # Calculate token expiration (7 days from last signin or current time)
        if current_user.last_signin_at:
            # Calculate from last signin
            expires_at = current_user.last_signin_at + timedelta(days=JWT_EXPIRATION_DAYS)
        else:
            # Fallback: calculate from now
            expires_at = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)

        # Return session data
        return SessionResponse(
            user=UserRead(
                id=current_user.id,
                email=current_user.email,
                created_at=current_user.created_at,
                updated_at=current_user.updated_at,
                last_signin_at=current_user.last_signin_at,
            ),
            expires_at=expires_at,
            is_active=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while checking session: {str(e)}"
        )
