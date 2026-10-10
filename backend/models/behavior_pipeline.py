from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class BehaviorEvent(BaseModel):
    id: str = Field(..., description="Unique event ID, e.g. evt_123456")
    userId: str = Field(..., description="User ID or guest identifier")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    source: str = Field(..., description="studio | journal | chat | mood | dashboard | replay")
    type: str = Field(..., description="Specific event action type")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Structured event payload")


class BehaviorEventCreate(BaseModel):
    source: str = Field(..., description="studio | journal | chat | mood | dashboard | replay")
    type: str = Field(..., description="Specific event action type")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    timestamp: Optional[str] = Field(None, description="Optional ISO timestamp; defaults to UTC now")


class BehaviorEventBatch(BaseModel):
    events: List[BehaviorEventCreate] = Field(..., description="Batch of events for offline sync")


class DailySummary(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    mood: Optional[str] = None
    energy: Optional[int] = None
    tension: Optional[int] = None
    studioMinutes: int = 0
    journalWords: int = 0
    chatSessions: int = 0
    streak: int = 0
    calmScore: int = 80
    lastActive: Optional[str] = None
    recommendedNextStep: Optional[str] = None


class WeeklySummary(BaseModel):
    days: List[DailySummary] = Field(default_factory=list)
    totalStudioMinutes: int = 0
    totalJournalWords: int = 0
    activeDays: int = 0
    consistencyPct: int = 0
    dominantThemes: List[str] = Field(default_factory=list)
    calmScoreTrend: str = "steady"


class MonthlyBehaviorSummary(BaseModel):
    month: str = Field(..., description="YYYY-MM")
    activeDays: int = 0
    totalStudioMinutes: int = 0
    totalJournalEntries: int = 0
    totalChatSessions: int = 0
    primaryThemes: List[str] = Field(default_factory=list)
    dominantMood: str = "calm"
    recoveryMomentsCount: int = 0


class UserPreferences(BaseModel):
    preferredVoice: str = "Nova"
    preferredWorld: str = "Sakura Garden"
    preferredCamera: str = "first_person"
    preferredJournalTime: str = "evening"
    preferredPracticeDuration: int = 5
    quietMode: bool = False


class BehaviorDiscovery(BaseModel):
    id: str
    title: str
    discovery: str
    evidence: str
    confidence: str  # "This has appeared across several weeks." | "I've noticed this several times." | "I'm still learning this rhythm."
    recommendedExperiment: str
