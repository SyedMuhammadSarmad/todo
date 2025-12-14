"""JWT token utilities for authentication."""
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Get JWT configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", "7"))


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token for authenticated user.

    Args:
        user_id: User ID to include in token payload
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)

    payload = {
        "sub": user_id,  # Subject (user ID)
        "exp": expire,    # Expiration time
        "iat": datetime.utcnow(),  # Issued at time
    }

    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string to verify

    Returns:
        Decoded token payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None


def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get the expiration datetime from a JWT token.

    Args:
        token: JWT token string

    Returns:
        Expiration datetime if valid, None if invalid
    """
    payload = verify_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None
