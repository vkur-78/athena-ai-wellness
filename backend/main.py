from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.conversations import router as conv_router
from api.voice import router as voice_router
from api.auth import router as auth_router
from api.profile import router as profile_router
from api.checkins import router as checkins_router
from api.journal import router as journal_router
from api.calm import router as calm_router
from api.studio import router as studio_router
from api.reflection import router as reflection_router
from api.behavior_insights import router as behavior_insights_router
from api.behavior_pipeline import router as behavior_pipeline_router
from api.world import router as world_router
from api.replay import router as replay_router
from api.living_replay import router as living_replay_router

app = FastAPI(
    title="Athena AI Mental Wellness Coach",
    description="Backend API for Athena AI Mental Wellness Companion",
    version="1.0.0"
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://athena-ai-wellness.vercel.app",
    "https://athena-wellness.vercel.app",
    "https://yang-international-joined-movement.trycloudflare.com",
    "https://balance-bean-newcastle-paid.trycloudflare.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://([a-zA-Z0-9_-]+\.)?vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes at both /api and root for guaranteed compatibility
app.include_router(chat_router, prefix="/api", tags=["Chat & Memory API"])
app.include_router(chat_router, tags=["Chat Direct"])
app.include_router(conv_router, prefix="/api", tags=["Conversations API"])
app.include_router(conv_router, tags=["Conversations Direct"])
app.include_router(voice_router, prefix="/api", tags=["Voice API"])
app.include_router(voice_router, tags=["Voice Direct"])
app.include_router(auth_router, prefix="/api", tags=["Auth API"])
app.include_router(auth_router, tags=["Auth Direct"])
app.include_router(profile_router, prefix="/api", tags=["Profile & Onboarding API"])
app.include_router(profile_router, tags=["Profile Direct"])
app.include_router(checkins_router, prefix="/api", tags=["Checkins API"])
app.include_router(checkins_router, tags=["Checkins Direct"])
app.include_router(journal_router, prefix="/api", tags=["Journal API"])
app.include_router(journal_router, tags=["Journal Direct"])
app.include_router(calm_router, prefix="/api", tags=["Calm Mode API"])
app.include_router(calm_router, tags=["Calm Mode Direct"])
app.include_router(studio_router, prefix="/api", tags=["Studio API"])
app.include_router(studio_router, tags=["Studio Direct"])
app.include_router(reflection_router, prefix="/api", tags=["Reflection & Monthly Report API"])
app.include_router(reflection_router, tags=["Reflection Direct"])
app.include_router(behavior_insights_router, prefix="/api", tags=["Behavior Intelligence API"])
app.include_router(behavior_insights_router, tags=["Behavior Intelligence Direct"])
app.include_router(behavior_pipeline_router, prefix="/api", tags=["Behavior Pipeline API"])
app.include_router(behavior_pipeline_router, tags=["Behavior Pipeline Direct"])
app.include_router(world_router, prefix="/api", tags=["Inner World API"])
app.include_router(world_router, tags=["Inner World Direct"])
app.include_router(replay_router, prefix="/api", tags=["Monthly Replay API"])
app.include_router(replay_router, tags=["Monthly Replay Direct"])
app.include_router(living_replay_router, prefix="/api", tags=["Living Replay API"])
app.include_router(living_replay_router, tags=["Living Replay Direct"])


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "Athena AI Mental Wellness API",
        "docs": "/docs"
    }


@app.get("/health")
@app.get("/api/health")
@app.get("/health/live")
@app.get("/api/v1/health/live")
def health_check_endpoints():
    from ai.provider_service import ai_provider_service
    return {
        "status": "healthy",
        "service": "Athena AI Backend",
        "timestamp": "ok",
        "ai_providers": ai_provider_service.get_provider_status()
    }


@app.get("/api/ai/providers/status")
@app.get("/ai/providers/status")
def ai_providers_status_endpoint():
    from ai.provider_service import ai_provider_service
    return ai_provider_service.get_provider_status()



@app.get("/api/system/time")
@app.get("/system/time")
def system_time_endpoint():
    from services.demo_date_projector import (
        get_current_server_date_ist,
        get_current_server_datetime_ist,
        get_demo_date_offset,
    )
    today = get_current_server_date_ist()
    now_dt = get_current_server_datetime_ist()
    offset = get_demo_date_offset()
    return {
        "server_time_ist": now_dt.isoformat(),
        "today": today.isoformat(),
        "timezone": "Asia/Kolkata",
        "date_offset_days": offset.days,
    }


