from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check(test_user, auth_headers):
    response = client.get("/api/v1/health", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
