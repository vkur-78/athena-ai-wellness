# Athena — Security & Privacy Architecture

Security, privacy, and user safety are fundamental architectural pillars of Athena. As an AI-powered personal wellness sanctuary handling sensitive reflections and mental wellness data, Athena implements defense-in-depth principles across all layers.

---

## 1. Authentication & Session Management

- **Cryptographic JWT Verification**: Every incoming API request to protected endpoints is validated against Supabase Auth public cryptographic keys (RS256 / JWKS) and asymmetric signature validation.
- **Session Expiry & Refresh**: Tokens expire on short lifespans (1 hour) with client-side refresh handling.
- **Clean Credential Handling**: The login and registration interfaces never prefill credentials or store passwords in persistent browser storage.

---

## 2. Authorization, IDOR Prevention & Tenant Isolation

- **Supabase Row-Level Security (RLS)**: PostgreSQL tables enforce `auth.uid() = user_id` policies. Direct database queries from authenticated contexts can only ever access rows belonging to the active identity.
- **Service-Side Ownership Enforcement**: API handlers extract the user identity directly from the validated JWT claims—never from client-supplied query parameters or body payloads.
- **Remediated Security Issue — Monthly Keepsake PDF IDOR**:
  > An object-level authorization issue was identified in the monthly keepsake PDF endpoint during pre-production security testing and was remediated with authenticated ownership enforcement and regression coverage.
  Any attempt to generate a PDF for an arbitrary user ID without matching JWT ownership is rejected with `HTTP 403 Forbidden`. Dedicated regression tests (`tests/test_17_bugs_regression.py`) permanently guard this boundary.

---

## 3. Demo Mode Isolation & Quota Boundaries

Athena features a safe, interactive demo experience for visitors without requiring credentials:

- **Isolated Ephemeral Identity**: Demo sessions run under a dedicated demo identifier strictly segregated from production user data.
- **Zero Cross-Contamination**: Logging out of a demo session completely purges demo session tokens, localStorage keys, and in-memory caches.
- **Device-Bound AI Message Quota**: Demo sessions are capped at 3 AI conversational messages per device. The quota is tracked server-side and client-persisted with tamper prevention.
- **Trial Entitlement**: Real authenticated accounts are granted a 30-day trial with server-side validation.

---

## 4. Input Validation, Injection & XSS Defense

- **Pydantic API Validation**: All incoming backend request payloads are strictly validated against Pydantic schema models. Unexpected fields, invalid types, and malformed inputs are rejected immediately with `HTTP 422`.
- **Parameterized SQL**: All database operations use Supabase parameterized query builders, preventing SQL injection vulnerabilities.
- **XSS-Safe React Rendering**: React automatically escapes strings rendered in the DOM, preventing script injection. No unsafe `dangerouslySetInnerHTML` is used with un-sanitized external input.

---

## 5. AI Safety & Crisis Safeguards

Athena is an AI wellness sanctuary designed for reflection and mindful growth. It is **not** positioned as a replacement for clinical therapy, medical professionals, or emergency crisis intervention.

- **Distress & Self-Harm Detection**: The conversational orchestrator continuously monitors message semantics for crisis or self-harm keywords and intent.
- **Immediate Care Interception**: When distress is detected, the AI orchestrates an immediate compassionate response and surfaces the **Sanctuary Care Modal** containing emergency helplines:
  - 988 Suicide & Crisis Lifeline (US/Canada)
  - Crisis Text Line (Text HOME to 741741)
  - Vandrevala Foundation & Kiran Helpline (India)
  - International crisis resources link
- **Prompt Injection Shielding**: Strict system prompt delimiters and safety boundaries instruct the AI model to ignore prompt-override attempts, jailbreak queries, and system disclosure instructions.

---

## 6. Secret Management & Zero-Secret Policy

- Production secrets (OpenAI API key, Supabase service role key, database credentials) are stored strictly in environment variables on secure hosting platforms (Vercel Project Settings, local production processes).
- No production keys or credentials exist in source code, repository commits, sample datasets, or documentation.
- Safe `.env.example` templates with empty placeholders are provided for open inspection.
