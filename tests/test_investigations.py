import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import models  # noqa: F401 - registers tables for test creation


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def test_create_list_and_get_case(client):
    created = client.post(
        "/api/v1/cases",
        json={
            "title": "  Example investigation  ",
            "description": "Testing case persistence",
        },
    )
    assert created.status_code == 201
    case = created.json()
    assert case["title"] == "Example investigation"
    assert case["status"] == "open"

    listed = client.get("/api/v1/cases")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == case["id"]

    fetched = client.get(f"/api/v1/cases/{case['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Example investigation"


def test_update_case_status(client):
    created = client.post(
        "/api/v1/cases",
        json={"title": "Status test"},
    )
    case_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/cases/{case_id}",
        json={"status": "paused"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "paused"


def test_missing_case_returns_404(client):
    response = client.get("/api/v1/cases/99999")
    assert response.status_code == 404


def test_create_and_list_evidence(client):
    case = client.post(
        "/api/v1/cases",
        json={"title": "Evidence test"},
    ).json()

    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        json={
            "title": "Public report",
            "source_type": "url",
            "source_url": "https://example.org/report",
            "collector": "analyst",
            "summary": "A test record, not a claim of verified facts.",
            "content_sha256": "a" * 64,
        },
    )
    assert response.status_code == 201
    evidence = response.json()
    assert evidence["case_id"] == case["id"]
    assert evidence["source_url"] == "https://example.org/report"
    assert evidence["content_sha256"] == "a" * 64

    listed = client.get(f"/api/v1/cases/{case['id']}/evidence")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["title"] == "Public report"


def test_invalid_sha256_is_rejected(client):
    case = client.post(
        "/api/v1/cases",
        json={"title": "Validation test"},
    ).json()

    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        json={
            "title": "Invalid hash",
            "source_type": "manual",
            "content_sha256": "not-a-sha256",
        },
    )
    assert response.status_code == 422


def test_evidence_for_missing_case_returns_404(client):
    response = client.post(
        "/api/v1/cases/99999/evidence",
        json={"title": "Orphan", "source_type": "manual"},
    )
    assert response.status_code == 404
