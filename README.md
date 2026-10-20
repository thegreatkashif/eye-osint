# 👁️ EYE OSINT Platform

**Open Intelligence & Geospatial Analysis Platform**

Developed by **[thegreatkashif](https://github.com/thegreatkashif)**.

EYE is an open-source, self-hosted investigation platform designed to organize cases, preserve evidence metadata, and provide a foundation for responsible Open-Source Intelligence (OSINT) and geospatial analysis.

The project is under active development. Its current focus is building a reliable investigation-management foundation before adding more advanced intelligence collection and analysis capabilities.

<p align="center">
  <strong>Investigate. Correlate. Preserve. Analyze.</strong>
</p>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Current Features](#current-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started on Windows](#getting-started-on-windows)
- [Database Configuration](#database-configuration)
- [Running EYE](#running-eye)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [Security and Responsible Use](#security-and-responsible-use)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

EYE is being developed as a modular OSINT platform where investigations can be organized into cases and supporting evidence can be recorded with source information and timestamps.

The long-term vision includes public-source intelligence collection, domain and IP intelligence, username research, geospatial visualization, relationship analysis, and investigation reporting.

These are development goals, not claims that every planned module is already operational.

## Current Features

### Investigation management
- Create and list investigation cases.
- Retrieve individual cases.
- Update case titles, descriptions, and statuses.
- Organize cases using `open`, `paused`, and `closed` statuses.

### Evidence management
- Attach evidence records to investigations.
- Record evidence titles, source types, source URLs, collectors, and summaries.
- Store collection timestamps and SHA-256 digest metadata.
- Retrieve individual evidence records and list evidence associated with a case.
- Validate request data and reject malformed SHA-256 digest strings.

### Integrity utilities
- Calculate SHA-256 hashes from exact byte sequences.
- Verify whether content matches a supplied SHA-256 digest.
- Test known digest values, malformed hashes, and modified content.

**Integrity limitation:** the hashing utility is implemented and tested, but automatic artifact capture and end-to-end verification of stored evidence are still under development. A validly formatted digest is not proof that evidence has been independently verified.

### Application foundation
- Next.js and React frontend.
- FastAPI backend with versioned REST endpoints.
- PostgreSQL persistence using SQLAlchemy.
- Alembic database migrations.
- API health and readiness endpoints.
- Automated tests using pytest and FastAPI's test client.
- GitHub Actions continuous integration foundation.
- Docker Compose configuration for the backend and database.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Python, FastAPI |
| API validation | Pydantic |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Integrity utilities | Python `hashlib` and SHA-256 |
| Testing | pytest, HTTPX |
| Containerization | Docker, Docker Compose |
| Version control | Git and GitHub Actions |

## Architecture

```text
┌───────────────────────────────┐
│       EYE Web Interface       │
│      Next.js / React          │
└──────────────┬────────────────┘
               │ HTTP / REST
               ▼
┌───────────────────────────────┐
│       FastAPI Backend         │
│                               │
│  Cases · Evidence · Health    │
│  Validation · Integrity       │
└──────────────┬────────────────┘
               │ SQLAlchemy
               ▼
┌───────────────────────────────┐
│          PostgreSQL           │
│       Cases and Evidence      │
└───────────────────────────────┘
```

The diagram represents the current application foundation. Future intelligence integrations and analysis services will be added as their implementations become available.

## Project Structure

```text
eye-osint/
├── .github/
│   └── workflows/
│       └── ci.yml
├── alembic/
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── api.py
│   ├── database.py
│   ├── integrity.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── tests/
│   ├── test_health.py
│   ├── test_integrity.py
│   └── test_investigations.py
├── .env.example
├── .gitignore
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── LICENSE
├── README.md
└── SECURITY.md
```

## Getting Started on Windows

The primary development workflow uses Windows, a Python virtual environment, a local PostgreSQL installation, and the Next.js development server.

### Prerequisites

Install the following:

- Git
- Python 3.13 or another supported Python version
- Node.js and npm
- PostgreSQL
- Visual Studio Code or another code editor

Docker is not required for the local development workflow.

### 1. Clone the repository

Open PowerShell:

```powershell
git clone https://github.com/thegreatkashif/eye-osint.git
Set-Location eye-osint
```

### 2. Create the Python environment

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If Python 3.13 is not registered with the Windows Python launcher, use the installed Python version that satisfies the project's dependencies.

### 3. Install frontend dependencies

```powershell
Set-Location .\frontend
npm install
Set-Location ..
```

### 4. Configure the environment

Create a local `.env` file in the project root. Do not commit this file.

```powershell
@'
DATABASE_URL=postgresql+psycopg://eye:REPLACE_WITH_YOUR_PASSWORD@127.0.0.1:5432/eye
EYE_ENV=development
'@ | Set-Content -Path .\.env -Encoding ascii
```

Replace `REPLACE_WITH_YOUR_PASSWORD` with the password for your local PostgreSQL `eye` role. Use a URL-safe password or percent-encode special characters in the connection URL.

### 5. Configure PostgreSQL

Create a dedicated development role and database using `psql` or pgAdmin. If you use `psql` as a PostgreSQL administrator, run:

```sql
CREATE ROLE eye WITH LOGIN PASSWORD 'YOUR_URL_SAFE_PASSWORD';
CREATE DATABASE eye OWNER eye;
```

Use the same password in `.env`.

If the `eye` role and database already exist, do not create them again. Keep EYE's development database separate from databases used by other applications.

### 6. Apply database migrations

From the project root, with the virtual environment activated:

```powershell
python -m alembic upgrade head
```

To inspect the current migration revision:

```powershell
python -m alembic current
```

## Running EYE

Start the backend and frontend in separate PowerShell terminals.

### Terminal 1: FastAPI backend

From the project root:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Useful backend URLs:

- API health: `http://127.0.0.1:8000/health/live`
- Database readiness: `http://127.0.0.1:8000/health/ready`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### Terminal 2: Next.js frontend

From the project root:

```powershell
Set-Location .\frontend
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000` in your browser.

The frontend uses the local FastAPI service for investigation operations. Keep both development servers running while using the application.

## API Reference

The current API is versioned under `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/cases` | Create a case |
| `GET` | `/api/v1/cases` | List cases |
| `GET` | `/api/v1/cases/{case_id}` | Retrieve a case |
| `PATCH` | `/api/v1/cases/{case_id}` | Update a case |
| `POST` | `/api/v1/cases/{case_id}/evidence` | Create an evidence record |
| `GET` | `/api/v1/cases/{case_id}/evidence` | List case evidence |
| `GET` | `/api/v1/evidence/{evidence_id}` | Retrieve an evidence record |

List endpoints support pagination parameters where implemented.

### Example: Create an investigation

```powershell
$body = @{
    title = "Example investigation"
    description = "Development test case"
    status = "open"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/api/v1/cases" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Example: Attach evidence

```powershell
$body = @{
    title = "Public report"
    source_type = "url"
    source_url = "https://example.org/report"
    collector = "local-development"
    summary = "Example record for API testing."
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/api/v1/cases/1/evidence" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

This example records evidence metadata. It does not automatically download or archive the referenced page.

Supported source types currently include `manual`, `url`, `public_record`, `api`, `file`, and `other`.

## Testing

Run the automated test suite from the project root:

```powershell
python -m pytest -q
```

Check formatting errors in staged Git changes before committing:

```powershell
git diff --cached --check
```

The test suite covers core API behavior, request validation, and SHA-256 utilities. Passing tests do not imply that unimplemented integrations or production security controls have been verified.

## Docker Deployment

The repository includes a Docker Compose configuration for the API and PostgreSQL database. The Compose configuration expects `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_URL` environment variables.

For a containerized deployment, configure these values in a private `.env` file:

```dotenv
POSTGRES_DB=eye
POSTGRES_USER=eye
POSTGRES_PASSWORD=REPLACE_WITH_A_STRONG_URL_SAFE_SECRET
DATABASE_URL=postgresql+psycopg://eye:REPLACE_WITH_A_STRONG_URL_SAFE_SECRET@db:5432/eye
EYE_ENV=development
```

Replace the placeholder secret in both locations with the same value. This container configuration uses `db` as the database hostname; it is different from the `127.0.0.1` URL used for local Windows development.

Then start the configured services:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

The API is published on `127.0.0.1:8787` by the current Compose configuration. Check:

- `http://127.0.0.1:8787/health/live`
- `http://127.0.0.1:8787/health/ready`

The current Compose file runs the backend and database. Run the frontend separately using the local development instructions unless and until a frontend container is configured.

Do not use the example credentials in a real deployment. Production configuration, authentication, authorization, backups, and deployment hardening must be completed before exposing EYE to untrusted networks.

## Security and Responsible Use

EYE is intended for lawful investigations using public information and data sources for which the operator has authorization.

- Never commit credentials, access tokens, private keys, or `.env` files.
- Do not store private investigation evidence in the public Git repository.
- Restrict database access and protect stored investigation data.
- Keep the API bound to localhost until authentication and authorization are implemented and reviewed.
- Treat intelligence matches, inferred relationships, and automated analysis as unverified until independently corroborated.
- Respect privacy, applicable law, source terms, and data-retention requirements.
- Do not use EYE to gain unauthorized access to devices, accounts, private cameras, or restricted systems.

Review [SECURITY.md](SECURITY.md) for the project's security reporting guidance.

## Roadmap

Planned areas of development include:

- [ ] Automated evidence capture and artifact storage.
- [ ] End-to-end evidence integrity verification.
- [ ] Safe public-URL collection with SSRF protections.
- [ ] Domain, IP, DNS, and infrastructure intelligence.
- [ ] Username and public-profile research integrations.
- [ ] Geospatial visualization and mapping.
- [ ] Relationship graphs and entity correlation.
- [ ] Exportable investigation reports with provenance.
- [ ] Authentication, authorization, and audit logging.
- [ ] Optional local AI-assisted analysis.

Roadmap items are goals, not currently guaranteed features. Their availability will depend on implementation, testing, and security review.

## Contributing

Contributions, bug reports, and practical suggestions are welcome.

1. Fork the repository.
2. Create a focused branch for your change.
3. Add or update tests.
4. Run `python -m pytest -q`.
5. Submit a pull request describing the change and its security implications.

Keep changes modular, document configuration requirements, and never include real investigation data or secrets in test fixtures.

## License

EYE is distributed under the license included in the repository. See [LICENSE](LICENSE) for the applicable terms.

---

<p align="center">
  <strong>EYE OSINT</strong><br>
  Open Intelligence & Geospatial Analysis Platform<br>
  Developed by <a href="https://github.com/thegreatkashif">thegreatkashif</a>
</p>