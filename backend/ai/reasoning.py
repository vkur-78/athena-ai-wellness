import json
import re
from config import OPENAI_MODEL
from ai.prompts import REASONING_PROMPT
from ai.provider_service import ai_provider_service

DEFAULT_REASONING = {
    "risk": "none",
    "primary_emotion": "reflective",
    "secondary_emotion": None,
    "intensity": "moderate",
    "thinking_pattern": "none",
    "conversation_stage": "exploration",
    "current_focus": "mental wellness",
    "therapy_approach": "holding space",
    "suggested_exercise": None,
    "new_insights": {
        "user_name": None,
        "new_stressors": [],
        "thinking_pattern": None,
        "coping_preference": None,
        "memory_fact": None,
        "mood_entry": None,
        "wellness_goal": None,
        "milestone": None,
        "recurring_worries": [],
        "repeated_people": [],
        "repeated_situations": [],
        "emotional_improvements": [],
        "unresolved_topics": []
    },
    "suggested_replies": [
        "I feel like I'm carrying so much pressure right now",
        "Could we explore what is making this feel so heavy?",
        "How can I stop overthinking this?"
    ]
}

CRISIS_KEYWORDS = [
    "kill myself", "suicide", "end my life", "end it all",
    "want to die", "wanna die", "wish i was dead", "better off dead",
    "take my own life", "cut myself", "hang myself", "overdose",
    "slit my", "shoot myself", "jump off a"
]

SAFE_OR_CASUAL_PHRASES = {
    "hi", "hello", "hey", "good morning", "good evening", "good afternoon",
    "how are you", "what's up", "whats up", "what is your name",
    "tell me a joke", "tell me a story", "i am safe", "i am safe right now",
    "i'm safe", "im safe", "i am okay", "i'm okay", "im ok", "i feel better",
    "i'm fine", "im fine", "okay", "ok", "thanks", "thank you", "yes", "no",
    "what can you do", "who are you", "can you help me", "help me relax",
    "can we talk", "im good", "i am good", "fine", "cool", "alright"
}

def is_ambiguous_hopelessness(text: str) -> bool:
    lower = text.lower().strip()
    hopeless_markers = [
        "everything is finished", "all is finished", "it's all finished", "its all finished",
        "everything is over", "it's all over", "its all over",
        "nothing left for me", "nothing is left", "nothing left",
        "no reason to keep going", "no reason to go on", "no reason to continue",
        "don't see how things will get better", "dont see how things will get better",
        "cant see how things will get better", "can't see how things will get better",
        "no point in trying", "what's the point of anything", "whats the point of anything",
        "what's the point of living", "whats the point of living",
        "nothing ever gets better", "nothing will change", "feels pointless",
        "don't see any way out", "dont see any way out",
        "sab kuch khatam", "sab khatam"
    ]
    return any(m in lower for m in hopeless_markers) and not contains_explicit_crisis(text)

def classify_safety(text: str) -> str:
    """
    Layered safety classification:
    - IMMINENT_DANGER: Explicit active intent with urgency ('tonight', 'now', 'have pills', 'goodbye', 'gone end myself')
    - SUICIDAL_IDEATION: Direct 1st-person desire to die ('want to die', 'wish i was dead', 'end my life', 'end myself')
    - SELF_HARM_REFERENCE: Non-suicidal self injury references ('cut myself', 'hurting myself')
    - EMOTIONAL_DISTRESS: Heavy distress, panic, overwhelm, grief
    - SAFE: Casual, safe, reflective, movie/literature/historical discussions
    """
    lower = text.lower().strip()

    # Contextual exclusion: Discussing movies, books, or third-party reports
    contextual_exclusions = [
        "watched a movie", "saw a movie", "read a book", "in the news",
        "documentary", "actor", "character", "he committed", "she committed",
        "talking about suicide", "story about suicide"
    ]
    if any(p in lower for p in contextual_exclusions) and not any(p in lower for p in ["i want to", "i will", "tonight", "right now", "my plan", "kill myself"]):
        return "SAFE"

    # 1. Imminent danger
    imminent_markers = [
        "end it right now", "end it tonight", "do it right now", "doing it tonight",
        "hurt myself tonight", "kill myself tonight", "have the pills", "saying goodbye",
        "already took", "jump off", "have a gun", "gonna do it tonight", "cant live past tonight",
        "gone end myself", "gonna end myself", "going to end myself", "about to end my life",
        "ending myself tonight", "end my life tonight"
    ]
    if any(m in lower for m in imminent_markers):
        return "IMMINENT_DANGER"

    # 2. Suicidal ideation
    suicide_markers = [
        "kill myself", "commit suicide", "end my life", "end it all", "end myself",
        "take my own life", "take my life", "want to die", "wanna die",
        "wish i was dead", "better off dead", "no reason to live", "cannot live anymore"
    ]
    if any(m in lower for m in suicide_markers):
        return "SUICIDAL_IDEATION"

    # 3. Self-harm reference
    self_harm_markers = [
        "cut myself", "cutting myself", "burn myself", "hurting myself", "slit my"
    ]
    if any(m in lower for m in self_harm_markers):
        return "SELF_HARM_REFERENCE"

    # 4. Emotional distress
    distress_markers = [
        "hopeless", "can't take this anymore", "falling apart", "overwhelmed",
        "panic attack", "crying all day", "so depressed", "so much pain",
        "exhausted with life", "breaking down"
    ]
    if any(m in lower for m in distress_markers):
        return "EMOTIONAL_DISTRESS"

    return "SAFE"

def contains_explicit_crisis(text: str) -> bool:
    safety = classify_safety(text)
    return safety in ("IMMINENT_DANGER", "SUICIDAL_IDEATION")


def is_casual_or_safe(text: str) -> bool:
    clean = re.sub(r"[^\w\s]", "", text.lower().strip())
    if clean in SAFE_OR_CASUAL_PHRASES:
        return True
    words = clean.split()
    if len(words) <= 4 and not contains_explicit_crisis(text):
        return True
    return False

def clean_json_string(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def heuristic_reasoning(
    message: str,
    history: list = None,
    user_memory: dict = None,
    user_profile: dict = None
) -> dict:
    """
    Rich clinical reasoning engine when LLM provider is offline or unconfigured.
    Contextually determines emotion, intensity, cognitive patterns, conversation stage,
    and therapeutic stance based on psychological markers and conversation continuity.
    """
    lower = message.lower().strip()
    result = dict(DEFAULT_REASONING)

    # 1. Explicit Crisis Protocol
    if contains_explicit_crisis(message):
        result["risk"] = "crisis"
        result["primary_emotion"] = "crisis"
        result["secondary_emotion"] = "acute distress"
        result["intensity"] = "high"
        result["conversation_stage"] = "crisis_support"
        result["therapy_approach"] = "immediate safety guidance and human helpline referral"
        result["suggested_replies"] = [
            "I am safe right now",
            "I am calling Tele-MANAS (14416)",
            "Can you guide me through slow breathing?"
        ]
        return result

    # 2. Ambiguous Hopelessness Protocol
    if is_ambiguous_hopelessness(message):
        result["risk"] = "moderate"
        result["primary_emotion"] = "hopelessness"
        result["secondary_emotion"] = "discouragement"
        result["intensity"] = "moderate"
        result["thinking_pattern"] = "pessimism"
        result["conversation_stage"] = "deep_exploration"
        result["current_focus"] = "navigating hopelessness"
        result["therapy_approach"] = "tender validation, holding space, gentle nonjudgmental safety check"
        result["suggested_replies"] = [
            "I am safe right now, just feeling weighed down",
            "It feels like nothing I do changes anything",
            "Can you stay with me while I think through this?"
        ]
        return result

    # 3. Casual / Greeting / Opening Turn
    if is_casual_or_safe(message) and any(w in lower for w in ["hi", "hello", "hey", "morning", "evening", "afternoon", "namaste", "how are you", "who are you"]):
        result["risk"] = "none"
        result["primary_emotion"] = "welcoming"
        result["secondary_emotion"] = "open"
        result["intensity"] = "low"
        result["conversation_stage"] = "opening"
        result["current_focus"] = "greeting"
        result["therapy_approach"] = "warm holding presence and gentle intake"
        result["suggested_replies"] = [
            "I'm feeling a little overwhelmed today",
            "There's something on my mind I'd like to share",
            "I'm just checking in to clear my head"
        ]
        return result

    # 4. Acute Distress / Fed Up / Burnout / Exhaustion
    fed_up_markers = [
        "fed up", "exhausted", "tired of", "can't take it", "cant take it",
        "done with", "so drained", "over it", "at my limit", "breaking point",
        "burnout", "burned out", "cannot do this", "sick and tired"
    ]
    if any(m in lower for m in fed_up_markers):
        result["risk"] = "low"
        result["primary_emotion"] = "frustration"
        result["secondary_emotion"] = "emotional exhaustion"
        result["intensity"] = "moderate"
        result["thinking_pattern"] = "depletion"
        result["conversation_stage"] = "emotional_discharge"
        result["current_focus"] = "burnout and exhaustion"
        result["therapy_approach"] = "deep unconditional validation, slow pacing, and holding space"
        result["suggested_replies"] = [
            "Everything feels like too much at once",
            "I just need a moment where nothing is demanded of me",
            "Can we pause together for a moment?"
        ]
        return result

    # 5. Academic / Exam / Study Stress (Strictly separate from workplace)
    academic_markers = [
        "neet", "exam", "exams", "study", "studying", "syllabus", "forgetting",
        "revision", "test", "marks", "score", "rank", "college", "parents disappointed",
        "disappoint my parents", "passing", "failure in exam"
    ]
    if any(m in lower for m in academic_markers):
        result["risk"] = "none"
        result["primary_emotion"] = "anxious"
        result["secondary_emotion"] = "academic pressure"
        result["intensity"] = "moderate"
        result["thinking_pattern"] = "catastrophizing" if any(w in lower for w in ["fail", "ruin", "never", "terrible", "disappoint"]) else "performance_pressure"
        result["conversation_stage"] = "exploration"
        result["current_focus"] = "academic and exam anxiety"
        result["therapy_approach"] = "validating exam stress, normalizing memory fatigue, collaborative perspective"
        result["suggested_replies"] = [
            "I'm scared of forgetting what I studied",
            "The expectations feel so heavy right now",
            "How can I calm my mind before revising?"
        ]
        return result

    # 6. Relationship & Interpersonal Distress
    relationship_markers = [
        "partner", "boyfriend", "girlfriend", "husband", "wife", "dating",
        "relationship", "hasn't spoken", "hasnt spoken", "not speaking", "silent treatment",
        "fight with", "argument", "breakup", "broke up"
    ]
    if any(m in lower for m in relationship_markers):
        result["risk"] = "none"
        result["primary_emotion"] = "anxious"
        result["secondary_emotion"] = "interpersonal uncertainty"
        result["intensity"] = "moderate"
        result["conversation_stage"] = "exploration"
        result["current_focus"] = "relationship communication"
        result["therapy_approach"] = "holding space for relational ambiguity without making assumptions"
        result["suggested_replies"] = [
            "It's hard sitting with the silence",
            "I keep wondering what I did wrong",
            "How can I manage this waiting anxiety?"
        ]
        return result

    # 7. Everyday Workplace / Career Stressors
    work_stress_markers = [
        "deadline", "work", "job", "boss", "manager", "project", "presentation",
        "client", "office", "career", "interview", "overtime", "workplace"
    ]
    if any(m in lower for m in work_stress_markers):
        result["risk"] = "none"
        result["primary_emotion"] = "anxious"
        result["secondary_emotion"] = "workplace expectations"
        result["intensity"] = "moderate"
        result["thinking_pattern"] = "urgency"
        result["conversation_stage"] = "exploration"
        result["current_focus"] = "workplace stress"
        result["therapy_approach"] = "grounding pacing, separating urgency from reality, manageable steps"
        result["suggested_replies"] = [
            "Work demands feel constant right now",
            "How do I set boundaries without guilt?",
            "Can we take a quick pause together?"
        ]
        return result

    # 8. Follow-up / Dependent Conversational Turns
    history_turns = [m for m in (history or []) if m.get("role") == "user"]
    followup_markers = [
        "it's mainly", "its mainly", "because", "and also", "they don't",
        "they dont", "nobody", "no one", "i tried", "what about", "why do i",
        "how come", "also", "even when", "still", "not really", "exactly",
        "makes sense", "hard to say"
    ]
    if (any(m in lower for m in followup_markers) or len(message.split()) <= 8) and len(history_turns) >= 1:
        prev_user_text = history_turns[-1].get("content", "").lower()
        result["risk"] = "none"
        result["primary_emotion"] = "reflective"
        result["secondary_emotion"] = "vulnerability"
        result["intensity"] = "moderate"
        result["conversation_stage"] = "deepening"
        result["therapy_approach"] = "attuned validation and empathetic connection to previous turn"
        result["suggested_replies"] = [
            "That's exactly how it feels",
            "How do I express this without causing conflict?",
            "I want to protect my own peace"
        ]
        return result

    # 9. Low Mood / Sadness
    if any(w in lower for w in ["low", "sad", "down", "crying", "unhappy", "blue"]):
        result["risk"] = "none"
        result["primary_emotion"] = "sadness"
        result["secondary_emotion"] = "tender reflection"
        result["intensity"] = "moderate"
        result["conversation_stage"] = "exploration"
        result["current_focus"] = "sitting with low mood"
        result["therapy_approach"] = "unhurried compassion, gentle acceptance, no pressure to fix"
        return result

    return result


def reason(message: str, history: list = None, user_memory: dict = None, user_profile: dict = None) -> dict:
    """
    Fast, deterministic clinical reasoning engine for Athena companion.
    Extracts emotional nuance, cognitive patterns, conversation stage, and clinical stance
    in sub-millisecond time, eliminating serial model bottlenecks before streaming.
    """
    return heuristic_reasoning(message, history, user_memory, user_profile)
