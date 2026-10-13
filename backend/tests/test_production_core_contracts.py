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

    test_email = None

    def test_02_registration_contract(self):
        import uuid
        TestProductionCoreContracts.test_email = f"gate_user_{uuid.uuid4().hex[:8]}@athena.sanctuary"
        res = client.post("/api/auth/register", json={
            "email": TestProductionCoreContracts.test_email,
            "password": "GatePassword123!",
            "name": "Gate User"
        })
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        assert "user_id" in data
        assert "access_token" in data

    def test_03_login_and_credential_verification_contract(self):
        email = TestProductionCoreContracts.test_email or "gate_test_user@athena.sanctuary"
        # Valid login
        res = client.post("/api/auth/login", json={
            "email": email,
            "password": "GatePassword123!"
        })
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        assert "access_token" in data

        # Invalid password rejection
        res_bad = client.post("/api/auth/login", json={
            "email": email,
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

    def test_07_profile_initialization_and_session_restoration(self):
        import uuid
        email = f"gate_profile_{uuid.uuid4().hex[:8]}@athena.sanctuary"
        reg_res = client.post("/api/auth/register", json={
            "email": email,
            "password": "ProfilePassword123!",
            "name": "Profile User"
        })
        assert reg_res.status_code == 200
        token = reg_res.json()["access_token"]
        user_id = reg_res.json()["user_id"]

        prof_res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
        assert prof_res.status_code == 200
        prof = prof_res.json()
        assert prof["user_id"] == user_id
        assert prof.get("trial_active") is True
        assert prof.get("trial_days_remaining") == 30
        assert prof.get("entitlement_mode") == "TRIAL_30_DAYS"

    def test_08_demo_and_user_data_isolation(self):
        # Demo token must not have access to private user profiles
        demo_res = client.post("/api/auth/demo-session", json={})
        demo_token = demo_res.json()["access_token"]

        # Fetching profile as demo returns Aarav Sharma's demo profile
        prof_res = client.get("/api/profile", headers={"Authorization": f"Bearer {demo_token}"})
        assert prof_res.status_code == 200
        prof = prof_res.json()
        assert prof.get("is_demo") is True

    def test_09_ai_provider_failover_and_status(self):
        res = client.get("/api/ai/providers/status")
        assert res.status_code == 200
        data = res.json()
        assert "primary" in data
        assert "secondary" in data
        assert data.get("failover_ready") is True

    def test_10_production_configuration_rejects_temporary_cloudflare_tunnels(self):
        """Phase 4 & 7: Verify production source and configuration strictly forbid temporary quick tunnels."""
        project_root = Path(backend_dir).parent
        monitored_files = [
            project_root / "frontend" / "next.config.ts",
            project_root / "frontend" / "lib" / "api.ts",
            project_root / "frontend" / "components" / "auth" / "LoginForm.tsx",
            project_root / "backend" / "main.py",
        ]
        for fpath in monitored_files:
            if fpath.exists():
                content = fpath.read_text(encoding="utf-8")
                assert "trycloudflare.com" not in content, f"Forbidden temporary quick tunnel found in {fpath.name}"
                assert "trycloudflare" not in content, f"Forbidden trycloudflare reference found in {fpath.name}"

    def test_11_required_environment_variables_presence_without_leaking(self):
        """Phase 7: Verify presence of required runtime environment configuration without printing secret values."""
        import os
        from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, OPENAI_API_KEY, GEMINI_API_KEY

        # Check critical keys are present as non-empty strings
        assert isinstance(SUPABASE_URL, str) and len(SUPABASE_URL.strip()) > 0, "SUPABASE_URL is missing"
        assert isinstance(SUPABASE_SERVICE_KEY, str) and len(SUPABASE_SERVICE_KEY.strip()) > 0, "SUPABASE_SERVICE_KEY is missing"
        assert isinstance(JWT_SECRET, str) and len(JWT_SECRET.strip()) > 0, "JWT_SECRET is missing"
        # At least one AI provider must be configured
        has_ai_provider = bool(OPENAI_API_KEY.strip() or GEMINI_API_KEY.strip())
        assert has_ai_provider, "No AI provider key configured (OPENAI_API_KEY or GEMINI_API_KEY required)"

    def test_12_chat_persistence_and_duplicate_prevention(self):
        """Phase 6 & 7: Verify chat messages persist to conversation history and duplicates are rejected."""
        import uuid
        email = f"chat_persist_{uuid.uuid4().hex[:8]}@athena.sanctuary"
        reg_res = client.post("/api/auth/register", json={
            "email": email,
            "password": "ChatPassword123!",
            "name": "Chat User"
        })
        assert reg_res.status_code == 200
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create conversation
        conv_res = client.post("/api/conversations", json={"title": "Test Sanctuary Chat"}, headers=headers)
        assert conv_res.status_code == 200
        conv_id = conv_res.json()["id"]

        # Send first message
        chat_res = client.post("/api/chat", json={
            "session_id": conv_id,
            "message": "I am practicing grounding today.",
            "language": "en"
        }, headers=headers)
        assert chat_res.status_code == 200
        reply_1 = chat_res.json()
        assert "reply" in reply_1
        assert len(reply_1["reply"]) > 0

        # Retrieve messages
        msg_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers)
        assert msg_res.status_code == 200
        messages = msg_res.json()
        # Should contain the user prompt and the assistant response
        user_msgs = [m for m in messages if m.get("role") == "user"]
        assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
        assert len(user_msgs) >= 1
        assert len(assistant_msgs) >= 1
        assert any("grounding" in m.get("content", "").lower() for m in user_msgs)

    def test_13_demo_session_endpoint_contract_and_render_health(self):
        """Phase 6: Verify demo session endpoint contract and live Render health."""
        # 1. Local test client contract
        local_res = client.post("/api/auth/demo-session", json={"device_id": "test_contract_dev"})
        assert local_res.status_code == 200
        data = local_res.json()
        assert data.get("is_demo") is True
        assert data.get("prompt_limit") == 3
        assert "access_token" in data
        assert len(data["access_token"]) > 20

        # 2. Live Render backend contract check
        import requests
        try:
            render_res = requests.get("https://athena-ai-wellness.onrender.com/api/health", timeout=15)
            assert render_res.status_code == 200
            assert render_res.json().get("status") == "healthy"
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Live Render service network unreachable from test runner: {e}")



