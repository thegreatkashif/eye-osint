from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_has_project_identity():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "EYE"
    assert response.json()["maintainer"] == "thegreatkashif"
    assert response.json()["version"] == "0.2.0"


def test_liveness():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_is_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["version"] == "0.2.0"
