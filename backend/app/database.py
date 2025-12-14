"""Database connection and session management."""
from sqlmodel import create_engine, Session
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create database engine
engine = create_engine(
    DATABASE_URL,
    echo=True if os.getenv("APP_ENV") == "development" else False,
    pool_pre_ping=True,  # Test connections before using them
)


def get_session():
    """
    FastAPI dependency for database session.

    Yields:
        Database session that will be automatically closed after use
    """
    with Session(engine) as session:
        yield session
