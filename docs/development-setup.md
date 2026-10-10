# Athena — Development Setup

Please refer to the full [Local Development Guide](DEVELOPMENT.md) for step-by-step setup instructions, environment variable configurations, testing commands, and troubleshooting.

### Quick Start Summary

```bash
# 1. Clone repository
git clone https://github.com/vkur-78/athena-ai-wellness.git
cd athena-ai-wellness

# 2. Setup backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --host 127.0.0.1 --port 8001 --reload

# 3. Setup frontend (in separate terminal)
cd frontend
npm install
cp ../frontend/.env.example .env.local
npm run dev
```
