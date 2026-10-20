"""Database configuration and session management for EYE."""

import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Load the project-local .env while preserving explicitly supplied environment
# variables. This works consistently when launched from the repo root or by
# Alembic. The real .env must never be committed.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=False)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Create a local .env file from .env.example "
        "and configure the development database URL."
    )

# Fail early on malformed URLs without printing the URL (which may contain a secret).
try:
    _database_url = make_url(DATABASE_URL)
except Exception as exc:
    raise RuntimeError("DATABASE_URL is not a valid SQLAlchemy URL.") from exc

if _database_url.drivername not in {"postgresql+psycopg", "postgresql"}:
    raise RuntimeError("EYE requires PostgreSQL for this application configuration.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=2,
    pool_timeout=5,
    pool_recycle=1800,
)

class Base(DeclarativeBase):
    """Base class for EYE database models."""

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)

def get_db() -> Generator[Session, None, None]:
    """Provide one database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
