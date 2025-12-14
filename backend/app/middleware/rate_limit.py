"""Rate limiting middleware for authentication endpoints."""
from fastapi import Request, HTTPException, status
from datetime import datetime, timedelta
from typing import Dict, List
from collections import defaultdict

# In-memory storage for rate limiting (use Redis in production)
# Format: {email: [(timestamp1, timestamp2, ...)]}
rate_limit_store: Dict[str, List[datetime]] = defaultdict(list)

# Rate limit configuration
MAX_ATTEMPTS = 5  # Maximum signin attempts
WINDOW_MINUTES = 1  # Time window in minutes


def check_rate_limit(email: str) -> None:
    """
    Check if email has exceeded rate limit for signin attempts.

    Args:
        email: Email address to check

    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=WINDOW_MINUTES)

    # Get attempts for this email
    attempts = rate_limit_store[email]

    # Remove attempts outside the time window
    rate_limit_store[email] = [
        attempt for attempt in attempts
        if attempt > window_start
    ]

    # Check if limit exceeded
    if len(rate_limit_store[email]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many signin attempts. Please try again in {WINDOW_MINUTES} minute(s)."
        )

    # Record this attempt
    rate_limit_store[email].append(now)


def clear_rate_limit(email: str) -> None:
    """
    Clear rate limit for an email (called on successful signin).

    Args:
        email: Email address to clear rate limit for
    """
    if email in rate_limit_store:
        del rate_limit_store[email]
