"""EYE OSINT Platform API."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api import router as investigations_router
from app.database import engine

logger = logging.getLogger("eye.health")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine.dispose()


app = FastAPI(
    title="EYE OSINT Platform API",
    description="Open Intelligence & Geospatial Analysis Platform by thegreatkashif",
    version="0.2.0",
    lifespan=lifespan,
)

# Local-development origins only. CORS is not authentication.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(investigations_router)


@app.get("/", tags=["System"])
def root():
    return {
        "name": "EYE",
        "version": "0.2.0",
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
        # Keep details in server logs; never send connection strings to clients.
        logger.exception("Database readiness check failed")
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        ) from None

    return {"status": "ready", "database": "connected"}
