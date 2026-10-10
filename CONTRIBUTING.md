# Contributing to Athena

Thank you for your interest in contributing to Athena! We welcome contributions that uphold our high standards of software quality, safety, and privacy.

---

## 1. Development Setup

Follow the [Development Guide](docs/DEVELOPMENT.md) to set up your local environment:
- Node.js 18+ & Python 3.10+
- Create virtual environments and install dependencies (`npm install` and `pip install -r requirements.txt`).
- Configure local environment files from `.env.example`.

---

## 2. Branch Naming & Commits

- Create descriptive feature branches from `main`:
  - `feat/feature-name`
  - `fix/issue-description`
  - `docs/update-topic`
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

---

## 3. Testing Requirements Before PR

All changes must pass automated verification suites before opening a Pull Request:

```bash
# 1. Run backend tests (all 91+ tests must pass)
cd backend && pytest -v

# 2. Run regression suite
pytest tests/test_17_bugs_regression.py -v

# 3. Verify frontend production build
cd ../frontend && npm run build
```

---

## 4. Security & Safety Expectations

- **Zero Secret Commits**: Never commit API keys, service role tokens, passwords, or personal credentials.
- **Privacy & User Isolation**: Do not bypass Row-Level Security (RLS) or object ownership validation.
- **AI Safety**: Do not weaken crisis detection boundaries, prompt protections, or emergency escalation hooks.
- **No Real User Data**: Only use synthesized, non-identifying mock fixtures in test files.
