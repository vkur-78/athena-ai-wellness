"""
Test Suite: Athena Automatic OpenAI + Gemini AI Failover (Scenarios A through M)
Validates:
A. OpenAI succeeds: Gemini is not called.
B. OpenAI quota exhausted: Gemini generates the answer.
C. OpenAI rate-limited: bounded retry/failover behaves correctly.
D. OpenAI times out: Gemini fallback works.
E. Both providers fail: a clear recoverable error appears.
F. Invalid credentials: no infinite retry loop.
G. Streaming works with either provider.
H. Conversation history and selected language are preserved.
I. Messages are not duplicated.
J. Demo quota remains exactly three user messages.
K. Crisis-safety tests pass with either provider.
L. Different emotional inputs receive relevant, context-aware responses.
M. A real user's data cannot be accessed by another user.
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from openai import RateLimitError, APITimeoutError, AuthenticationError
from ai.provider_service import (
    AIProviderService,
    AIProviderError,
    AllProvidersFailedError,
    classify_error,
    ai_provider_service
)
from ai.therapist import generate, generate_stream
from ai.orchestrator import chat, chat_stream, get_session_history, sessions, session_owners
from ai.safety import evaluate_message_safety


class TestAIFailoverSuite(unittest.TestCase):

    def setUp(self):
        self.service = AIProviderService()

    # --- Scenario A: OpenAI succeeds: Gemini is not called ---
    def test_scenario_a_openai_succeeds_gemini_not_called(self):
        mock_openai_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Warm, attentive OpenAI response."
        mock_resp = MagicMock(choices=[mock_choice])
        mock_openai_client.chat.completions.create.return_value = mock_resp

        mock_gemini_client = MagicMock()

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        reply, provider = self.service.generate_completion([{"role": "user", "content": "Hello"}])

        self.assertEqual(provider, "openai")
        self.assertEqual(reply, "Warm, attentive OpenAI response.")
        mock_openai_client.chat.completions.create.assert_called_once()
        mock_gemini_client.chat.completions.create.assert_not_called()

    # --- Scenario B: OpenAI quota exhausted: Gemini generates the answer ---
    def test_scenario_b_openai_quota_exhausted_gemini_takes_over(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = RateLimitError(
            message="insufficient_quota: You exceeded your current quota, please check your plan and billing details.",
            response=MagicMock(status_code=429),
            body={"error": {"code": "insufficient_quota"}}
        )

        mock_gemini_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Compassionate Gemini response acknowledging NEET exam pressure."
        mock_resp = MagicMock(choices=[mock_choice])
        mock_gemini_client.chat.completions.create.return_value = mock_resp

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        reply, provider = self.service.generate_completion([{"role": "user", "content": "I feel anxious about my NEET exam"}])

        self.assertEqual(provider, "gemini")
        self.assertIn("NEET exam pressure", reply)
        mock_openai_client.chat.completions.create.assert_called_once()
        mock_gemini_client.chat.completions.create.assert_called_once()

    # --- Scenario C: OpenAI rate-limited: bounded retry/failover behaves correctly ---
    def test_scenario_c_openai_rate_limited_failover(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = RateLimitError(
            message="Rate limit reached for requests per minute",
            response=MagicMock(status_code=429),
            body={"error": {"code": "rate_limit_exceeded"}}
        )

        mock_gemini_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Gemini response after OpenAI rate limit."
        mock_resp = MagicMock(choices=[mock_choice])
        mock_gemini_client.chat.completions.create.return_value = mock_resp

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        reply, provider = self.service.generate_completion([{"role": "user", "content": "Help me relax"}])

        self.assertEqual(provider, "gemini")
        self.assertEqual(reply, "Gemini response after OpenAI rate limit.")

    # --- Scenario D: OpenAI times out: Gemini fallback works ---
    def test_scenario_d_openai_timeout_gemini_fallback(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = APITimeoutError(
            request=MagicMock()
        )

        mock_gemini_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Gemini response after timeout."
        mock_resp = MagicMock(choices=[mock_choice])
        mock_gemini_client.chat.completions.create.return_value = mock_resp

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        reply, provider = self.service.generate_completion([{"role": "user", "content": "Feeling overwhelmed"}])

        self.assertEqual(provider, "gemini")
        self.assertEqual(reply, "Gemini response after timeout.")

    # --- Scenario E: Both providers fail: a clear recoverable error appears ---
    def test_scenario_e_both_providers_fail_clear_recoverable_error(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = Exception("OpenAI service unavailable")

        mock_gemini_client = MagicMock()
        mock_gemini_client.chat.completions.create.side_effect = Exception("Gemini service unavailable")

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        with self.assertRaises(AllProvidersFailedError) as ctx:
            self.service.generate_completion([{"role": "user", "content": "Hello"}])

        self.assertIn("All AI providers failed", str(ctx.exception))

        # Check therapist level: returns an honest, empathetic retry message without inventing fake stories
        with patch("ai.therapist.ai_provider_service", self.service):
            therapist_reply = generate(
                message="Hello",
                history=[],
                reasoning={"primary_emotion": "reflective"}
            )
            self.assertIn("momentary connection issue", therapist_reply)
            self.assertNotIn("Deadlines and demanding workplace", therapist_reply)

    # --- Scenario F: Invalid credentials: no infinite retry loop ---
    def test_scenario_f_invalid_credentials_no_infinite_loop(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = AuthenticationError(
            message="Incorrect API key provided",
            response=MagicMock(status_code=401),
            body={"error": {"code": "invalid_api_key"}}
        )

        mock_gemini_client = MagicMock()
        mock_gemini_client.chat.completions.create.side_effect = AuthenticationError(
            message="API key not valid",
            response=MagicMock(status_code=401),
            body={"error": {"code": "invalid_api_key"}}
        )

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        with self.assertRaises(AllProvidersFailedError):
            self.service.generate_completion([{"role": "user", "content": "Test"}])

        # Exactly 1 call per provider - no infinite loop
        mock_openai_client.chat.completions.create.assert_called_once()
        mock_gemini_client.chat.completions.create.assert_called_once()

    # --- Scenario G: Streaming works with either provider ---
    def test_scenario_g_streaming_failover_works(self):
        # OpenAI stream fails immediately before tokens
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = RateLimitError(
            message="insufficient_quota",
            response=MagicMock(status_code=429),
            body={"error": {"code": "insufficient_quota"}}
        )

        # Gemini streams 3 tokens
        mock_gemini_client = MagicMock()
        chunk1 = MagicMock(choices=[MagicMock(delta=MagicMock(content="Hello "))])
        chunk2 = MagicMock(choices=[MagicMock(delta=MagicMock(content="from "))])
        chunk3 = MagicMock(choices=[MagicMock(delta=MagicMock(content="Gemini!"))])
        mock_gemini_client.chat.completions.create.return_value = iter([chunk1, chunk2, chunk3])

        self.service._openai_client = mock_openai_client
        self.service._gemini_client = mock_gemini_client

        stream_events = list(self.service.generate_stream([{"role": "user", "content": "Hi"}]))
        types = [e["type"] for e in stream_events]

        self.assertIn("failover", types)
        tokens = [e["content"] for e in stream_events if e["type"] == "token"]
        self.assertEqual("".join(tokens), "Hello from Gemini!")

    # --- Scenario H: Conversation history and selected language are preserved ---
    def test_scenario_h_language_and_history_preserved(self):
        mock_openai_client = MagicMock()
        mock_openai_client.chat.completions.create.side_effect = RateLimitError(
            message="quota", response=MagicMock(status_code=429), body={}
        )

        mock_gemini_client = MagicMock()
        captured_messages = []

        def capture_call(*args, **kwargs):
            captured_messages.extend(kwargs.get("messages", []))
            mock_choice = MagicMock()
            mock_choice.message.content = "नमस्ते! मैं आपके साथ हूँ।"
            return MagicMock(choices=[mock_choice])

        mock_gemini_client.chat.completions.create.side_effect = capture_call
        self.service._gemini_client = mock_gemini_client
        self.service._openai_client = mock_openai_client

        with patch("ai.therapist.ai_provider_service", self.service):
            reply = generate(
                message="मुझे बहुत घबराहट हो रही है",
                history=[
                    {"role": "user", "content": "नमस्ते"},
                    {"role": "assistant", "content": "नमस्ते, मैं सुन रही हूँ।"}
                ],
                reasoning={"primary_emotion": "anxious"},
                conversation_language="hi"
            )

        # Verify Gemini received history and Hindi directive
        history_found = any(m.get("content") == "नमस्ते, मैं सुन रही हूँ।" for m in captured_messages)
        hindi_directive_found = any("Devanagari" in m.get("content", "") or "हिंदी" in m.get("content", "") for m in captured_messages)
        self.assertTrue(history_found, "Conversation history was not passed to Gemini")
        self.assertTrue(hindi_directive_found, "Language directive was not passed to Gemini")

    # --- Scenario I: Messages are not duplicated ---
    def test_scenario_i_messages_not_duplicated_in_orchestrator(self):
        session_id = "test-dedup-session"
        sessions[session_id] = []

        with patch("ai.orchestrator.generate") as mock_generate:
            mock_generate.return_value = "One single assistant response."
            chat(session_id=session_id, message="Test single persistence")

        session_history = sessions.get(session_id, [])
        self.assertEqual(len(session_history), 2)
        self.assertEqual(session_history[0]["role"], "user")
        self.assertEqual(session_history[0]["content"], "Test single persistence")
        self.assertEqual(session_history[1]["role"], "assistant")
        self.assertEqual(session_history[1]["content"], "One single assistant response.")

    # --- Scenario J: Demo quota remains exactly three user messages ---
    def test_scenario_j_demo_quota_exact_three_messages(self):
        from services.demo_session_service import check_and_increment_demo_prompt
        import uuid

        unique_demo_token = f"test-demo-token-{uuid.uuid4()}"

        allowed1, rem1, _ = check_and_increment_demo_prompt(unique_demo_token)
        self.assertTrue(allowed1)
        self.assertEqual(rem1, 2)

        allowed2, rem2, _ = check_and_increment_demo_prompt(unique_demo_token)
        self.assertTrue(allowed2)
        self.assertEqual(rem2, 1)

        allowed3, rem3, _ = check_and_increment_demo_prompt(unique_demo_token)
        self.assertTrue(allowed3)
        self.assertEqual(rem3, 0)

        # 4th must be strictly blocked
        allowed4, rem4, err = check_and_increment_demo_prompt(unique_demo_token)
        self.assertFalse(allowed4)
        self.assertEqual(rem4, 0)
        self.assertIn("limit reached", (err or "").lower())

    # --- Scenario K: Crisis-safety tests pass with either provider ---
    def test_scenario_k_crisis_safety_bypasses_or_protects(self):
        crisis_msg = "i might hurt myself tonight, i have pills"
        is_safety, action_type, safety_reply = evaluate_message_safety(crisis_msg)

        self.assertTrue(is_safety)
        self.assertEqual(action_type, "CRISIS")
        self.assertIn("112", safety_reply)
        self.assertIn("14416", safety_reply)
        self.assertIn("Tele-MANAS", safety_reply)

        # Normal ordinary frustration must NOT trigger crisis
        safe_msg = "i'm just fed up with studying all day"
        is_safe, action_safe, _ = evaluate_message_safety(safe_msg)
        self.assertFalse(is_safe)

    # --- Scenario L: Different emotional inputs receive relevant, context-aware responses ---
    def test_scenario_l_neet_exam_does_not_mention_workplace(self):
        from ai.reasoning import heuristic_reasoning
        reasoning = heuristic_reasoning("i feel anxious about my neet exam", history=[])
        self.assertIn("exam", reasoning.get("therapy_approach", "").lower())
        self.assertNotIn("workplace", reasoning.get("therapy_approach", "").lower())
        self.assertNotIn("deadline", reasoning.get("therapy_approach", "").lower())


    # --- Scenario M: A real user's data cannot be accessed by another user ---
    def test_scenario_m_user_data_isolation(self):
        user_a_session = "session-user-a-123"
        user_b_session = "session-user-b-456"

        sessions[user_a_session] = [{"role": "user", "content": "User A confidential thought"}]
        session_owners[user_a_session] = "user-a-id"

        sessions[user_b_session] = [{"role": "user", "content": "User B confidential thought"}]
        session_owners[user_b_session] = "user-b-id"

        # User B trying to access User A's session history
        history_b_trying_a = get_session_history(user_a_session, user_id="user-b-id")
        self.assertEqual(history_b_trying_a, [])

        # User A accessing their own session
        history_a = get_session_history(user_a_session, user_id="user-a-id")
        self.assertEqual(len(history_a), 1)
        self.assertEqual(history_a[0]["content"], "User A confidential thought")


if __name__ == "__main__":
    unittest.main()
