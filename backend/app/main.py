"""FastAPI main application."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import tasks

# Create FastAPI application
app = FastAPI(
    title="Todo API",
    description="Multi-user todo application with authentication",
    version="2.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,  # Required for Better Auth cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(tasks.router)


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "Todo API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
