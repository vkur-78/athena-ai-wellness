import sys
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestProductionCoreContracts:
    """
    Automated regression gate enforcing core production contracts:
    - Health check & AI provider configuration
    - Registration & Login contracts
    - Demo session initialization & isolation
    - Demo 3-message quota limit and 4th-message blocking
    - Invalid credential rejection
    - Protected endpoint authentication enforcement
    """

    def test_01_health_and_ai_providers_contract(self):
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data.get("status") == "healthy"
        assert "ai_providers" in data
        assert data["ai_providers"]["primary"]["name"] == "OpenAI"
        assert data["ai_providers"]["primary"]["configured"] is True
        assert data["ai_providers"]["secondary"]["name"] == "Google Gemini"
        assert data["ai_providers"]["secondary"]["configured"] is True

    def test_02_registration_contract(self):
        email = "gate_test_user@athena.sanctuary"
        res = client.post("/api/auth/register", json={
            "email": email,
            "password": "GatePassword123!",
            "name": "Gate User"
        })
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        assert "user_id" in data
        assert "access_token" in data

    def test_03_login_and_credential_verification_contract(self):
        # Valid login
        res = client.post("/api/auth/login", json={
            "email": "gate_test_user@athena.sanctuary",
            "password": "GatePassword123!"
        })
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        assert "access_token" in data

        # Invalid password rejection
        res_bad = client.post("/api/auth/login", json={
            "email": "gate_test_user@athena.sanctuary",
            "password": "WrongPassword999!"
        })
        assert res_bad.status_code == 401
        assert "detail" in res_bad.json()

    def test_04_protected_endpoint_unauthorized_rejection(self):
        res = client.get("/api/profile")
        assert res.status_code == 401

        res_chat = client.post("/api/chat", json={"message": "hello"})
        assert res_chat.status_code == 401

    def test_05_demo_session_initialization_contract(self):
        res = client.post("/api/auth/demo-session", json={})
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        assert data.get("is_demo") is True
        assert data.get("remaining") == 3
        assert "access_token" in data
        assert "session_id" in data

    def test_06_demo_quota_boundary_and_fourth_message_rejection(self):
        # Initialize fresh demo
        res_init = client.post("/api/auth/demo-session", json={})
        data_init = res_init.json()
        token = data_init["access_token"]
        session_id = data_init["session_id"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3 accepted messages
        for idx in range(1, 4):
            res_msg = client.post("/api/chat", json={
                "message": f"Demo prompt {idx}",
                "session_id": session_id,
                "language": "en"
            }, headers=headers)
            assert res_msg.status_code == 200
            res_json = res_msg.json()
            assert res_json.get("demo_prompts_remaining") == (3 - idx)

        # 4th message must be blocked with HTTP 403
        res_4 = client.post("/api/chat", json={
            "message": "Demo prompt 4 (must be rejected)",
            "session_id": session_id,
            "language": "en"
        }, headers=headers)
        assert res_4.status_code == 403
        data_4 = res_4.json()
        assert data_4.get("detail", {}).get("error") == "demo_limit_reached" or "DEMO_LIMIT_REACHED" in str(data_4)
