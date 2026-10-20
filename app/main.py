"""EYE OSINT Platform API."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://eye:dev-only-change-me@localhost:5432/eye",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=2,
    pool_timeout=5,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine.dispose()


app = FastAPI(
    title="EYE OSINT Platform API",
    description="Open Intelligence & Geospatial Analysis Platform by thegreatkashif",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/", tags=["System"])
def root():
    return {
        "name": "EYE",
        "version": "0.1.0",
        "maintainer": "thegreatkashif",
        "status": "running",
    }


@app.get("/health/live", tags=["Health"])
def liveness():
    return {"status": "ok", "service": "eye-api"}


@app.get("/health/ready", tags=["Health"])
def readiness():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        ) from None

    return {"status": "ready", "database": "connected"}
