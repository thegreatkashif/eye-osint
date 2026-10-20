# EYE OSINT Platform

**Open Intelligence & Geospatial Analysis Platform**

Developed by **thegreatkashif**.

EYE is a self-hosted platform for organizing investigations using publicly
available intelligence and authorized data sources.

## Version 0.1.0

Initial capabilities:
- FastAPI application and health endpoints
- PostgreSQL through Docker Compose
- Automated API tests
- GitHub Actions CI foundation

## Requirements

- Docker Engine
- Docker Compose
- Git

## Setup

1. Copy `.env.example` to `.env`.
2. Replace the placeholder password with a strong random secret.
3. Set `DATABASE_URL` to use the same password.
4. Run `docker compose up -d --build`.
5. Test `http://127.0.0.1:8787/health/live`.
6. Test `http://127.0.0.1:8787/health/ready`.

The API is bound to localhost. Do not expose it publicly until authentication
and authorization have been implemented and reviewed.

## Tests

Install dependencies in an isolated Python environment, then run:

    pytest -q

## Security

- Never commit credentials, private keys, tokens, or `.env`.
- Use authorized data sources.
- Treat automated identity matches as unverified until checked.
- Do not store private investigation evidence in a public repository.
