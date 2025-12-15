"""FastAPI dependencies for authentication and database."""
from urllib.parse import unquote
from datetime import datetime
from fastapi import Cookie, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from .utils.jwt import verify_token
from .models.user import User
from .models.session import Session as SessionModel
from .database import get_session

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token (Authorization header).
    Used by auth endpoints that need full User object.

    Args:
        credentials: HTTP Authorization header with Bearer token
        session: Database session

    Returns:
        Authenticated User object

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    token = credentials.credentials

    # Verify and decode JWT token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token payload
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query database for user
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_id(
    request: Request,
    db_session: Session = Depends(get_session),
    better_auth_session_token: Optional[str] = Cookie(None, alias="better_auth.session_token")
) -> str:
    """
    Extract and verify user_id from Better Auth session cookie.
    Used by task endpoints that only need the user_id for filtering.

    Better Auth stores sessions in the database. The cookie contains a signed session token.
    We need to:
    1. Decode the cookie.
    2. Extract the token (before the signature dot).
    3. Verify it exists in the database and is valid.

    Args:
        request: FastAPI Request object
        db_session: Database session
        better_auth_session_token: Token from Better Auth cookie

    Returns:
        user_id (str): Authenticated user's ID

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    
    if not better_auth_session_token:
        # Try fallback names just in case
        better_auth_session_token = request.cookies.get("better-auth.session_token")
        if better_auth_session_token:
             pass
    
    if not better_auth_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode URL-encoded token
    decoded_cookie = unquote(better_auth_session_token)

    # Better Auth V1 cookie format: [token].[signature]
    # We only need the token part to query the database
    token = decoded_cookie.split(".")[0]

    # Query database for session
    # Note: frontend/lib/auth.ts maps 'token' to 'token_hash' column
    statement = select(SessionModel).where(SessionModel.token_hash == token)
    session = db_session.exec(statement).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration
    if session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return session.user_id
