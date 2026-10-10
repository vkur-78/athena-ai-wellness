# Athena — Local Development Guide

This guide walks you through setting up, running, testing, and debugging the Athena monorepo on your local development machine.

---

## 1. Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js**: v18.18.0 or later (v20+ LTS recommended)
- **npm** or **pnpm**: Node package manager
- **Python**: 3.10+ (Python 3.11, 3.12, or 3.13 recommended)
- **Git**: For version control
- **Supabase Account**: Free project for PostgreSQL and Authentication
- **OpenAI API Key**: Required for conversational AI, reflection generation, and insights

---

## 2. Repository Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/vkur-78/athena-ai-wellness.git
cd athena-ai-wellness
```

---

## 3. Environment Configuration

Copy the root `.env.example` template into appropriate environment files:

### Frontend Environment (`frontend/.env.local`)
Create `frontend/.env.local` with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api
BACKEND_URL=http://127.0.0.1:8001
```

### Backend Environment (`backend/.env`)
Create `backend/.env` with the following variables:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
PORT=8001
```

> [!WARNING]
> Never commit `.env` or `.env.local` files to source control. They are automatically ignored by `.gitignore`.

---

## 4. Backend Setup & Execution

### 1. Create a Python Virtual Environment

```bash
cd backend
python -m venv venv

# Activate on Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Activate on macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the FastAPI Development Server

```bash
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

The backend API will be available at:
- **API Base**: `http://127.0.0.1:8001`
- **Interactive Swagger Docs**: `http://127.0.0.1:8001/docs`
- **Health Check**: `http://127.0.0.1:8001/api/health`

---

## 5. Frontend Setup & Execution

Open a new terminal window:

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Run the Next.js Development Server

```bash
npm run dev
```

The frontend application will be running at `http://localhost:3000`.

---

## 6. Running Tests

### Backend Unit & Regression Suite

With your virtual environment active in the `backend` directory:

```bash
cd backend
pytest -v
```

To run the comprehensive 17-issue regression test suite:

```bash
pytest tests/test_17_bugs_regression.py -v
```

To run the pre-production master audit suite:

```bash
pytest tests/test_preproduction_qa_master.py -v
```

### Frontend Build Verification

To verify that the Next.js frontend builds cleanly without TypeScript or hydration errors:

```bash
cd frontend
npm run build
```

All 28 static and dynamic routes should compile cleanly.

---

## 7. Common Issues & Troubleshooting

### Port 8001 Already in Use
If port 8001 is occupied, locate and terminate the process:
```powershell
# Windows
Get-NetTCPConnection -LocalPort 8001 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Supabase Connection Refused
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.
- Ensure your IP is not blocked in your Supabase dashboard firewall settings.

### AI Responses Failing
- Verify that `OPENAI_API_KEY` is populated and has sufficient credit quota.
- Check backend console logs for HTTP 401 or 429 status codes.
