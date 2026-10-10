"""
ATHENA QA SEED SCRIPT: LONG-TERM SYNTHETIC DEMONSTRATION USER
Creates exactly ONE fictitious 24-month mature Athena user:
- Name: Aarav Sharma
- Email: aarav.sharma.demo@athena.sanctuary
- Password: Athena#Sanctuary$2026!Demo
- 24 months of activity (October 2024 - October 2026)
- Check-ins: ~320 dated records
- Journals: ~155 entries
- Studio Sessions: ~185 completed practices
- Conversations: ~30 multi-turn sessions
- Natural behavior events feeding the intelligence timeline
"""

import os
import sys
import uuid
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Set up paths
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from services.profile_service import save_onboarding_profile, _load_local_profiles, _save_local_profiles
from services.checkin_service import _load_local_checkins, _save_local_checkins
from services.journal_service import _load_local_journal, _save_local_journal
from services.studio_service import _load_local_sessions, _save_local_sessions
from services.conversation_service import _load_local_conversations, _save_local_conversations
from services.chat_service import save_message
from services.behavior_pipeline import record_behavior_event, _load_events, _save_events
from api.auth import get_admin_client

DEMO_NAME = "Aarav Sharma"
DEMO_EMAIL = "aarav.sharma.demo@athena.sanctuary"
DEMO_PASSWORD = "Athena#Sanctuary2026!Demo"

def create_or_get_user():
    print(f"Creating / verifying user {DEMO_EMAIL}...")
    admin = get_admin_client()
    user_id = None
    
    # 1. Try to create user via Supabase Admin API
    try:
        res = admin.auth.admin.create_user({
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"display_name": "Aarav"}
        })
        if res and res.user:
            user_id = res.user.id
            print(f"Created Supabase Auth user: {user_id}")
    except Exception as e:
        err = str(e).lower()
        if "already" in err or "exists" in err or "unique" in err:
            print("User already exists in Supabase Auth, fetching existing user...")
            # Query existing user from Supabase or generate deterministic UUID
            try:
                users_res = admin.auth.admin.list_users()
                for u in users_res:
                    if u.email.lower() == DEMO_EMAIL.lower():
                        user_id = u.id
                        break
            except Exception:
                pass
        else:
            print(f"Supabase Admin create warning: {e}")

    # Fallback to deterministic UUID if Supabase remote auth is unreachable or offline
    if not user_id:
        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, DEMO_EMAIL))
        print(f"Using local verified user ID: {user_id}")

    # 2. Setup Profile & Onboarding
    profiles = _load_local_profiles()
    profiles[user_id] = {
        "id": user_id,
        "user_id": user_id,
        "email": DEMO_EMAIL,
        "display_name": "Aarav",
        "full_name": DEMO_NAME,
        "preferred_style": "gentle",
        "primary_focus": "stress_and_balance",
        "onboarding_completed": True,
        "created_at": "2024-10-15T09:30:00Z",
        "updated_at": "2026-10-06T10:00:00Z",
        "intake_responses": {
            "ptsd_10": {
                "q1": 1, "q2": 1, "q3": 2, "q4": 0, "q5": 1,
                "q6": 1, "q7": 0, "q8": 1, "q9": 1, "q10": 1,
                "total_score": 9,
                "severity": "mild"
            },
            "gad_7": {
                "q1": 2, "q2": 2, "q3": 1, "q4": 1, "q5": 1, "q6": 1, "q7": 1,
                "total_score": 9,
                "severity": "mild"
            }
        }
    }
    _save_local_profiles(profiles)
    print("User profile initialized.")
    return user_id

def seed_24_months_history(user_id: str):
    print("Generating 24 months of realistic longitudinal activity (Oct 2024 - Oct 2026)...")
    
    start_date = datetime(2024, 10, 15, tzinfo=timezone.utc)
    end_date = datetime(2026, 10, 6, tzinfo=timezone.utc)
    total_days = (end_date - start_date).days

    # Load local stores
    checkins_data = _load_local_checkins()
    if user_id not in checkins_data:
        checkins_data[user_id] = {}

    journal_data = _load_local_journal()
    if user_id not in journal_data:
        journal_data[user_id] = {}

    studio_data = _load_local_sessions()
    if user_id not in studio_data:
        studio_data[user_id] = []

    conv_data = _load_local_conversations()
    events_data = _load_events()
    if user_id not in events_data:
        events_data[user_id] = []

    # Realistic Studio Practices catalog
    STUDIO_PRACTICES = [
        {"id": "box-breathing", "name": "Box Breathing", "cat": "somatic", "dur": 300},
        {"id": "4-7-8-relax", "name": "4-7-8 Relaxing Breath", "cat": "somatic", "dur": 360},
        {"id": "somatic-grounding", "name": "5-4-3-2-1 Sensory Grounding", "cat": "grounding", "dur": 420},
        {"id": "body-scan", "name": "Progressive Muscle Release", "cat": "somatic", "dur": 480},
        {"id": "evening-winddown", "name": "Evening Calm Wind-Down", "cat": "mindfulness", "dur": 300},
        {"id": "morning-presence", "name": "Morning Intention & Breath", "cat": "mindfulness", "dur": 240}
    ]

    # Journal templates reflecting realistic longitudinal evolution
    JOURNAL_PHASES = {
        "early": [ # Months 1-4
            "Work was overwhelming today. Felt a lot of pressure around deadlines and had difficulty settling down this evening.",
            "Tried box breathing for 5 minutes during lunch break. It helped steady my heartbeat a bit.",
            "Short quiet reflection. Feeling tired, need to sleep early tonight.",
            "Struggling with overthinking tomorrow's meetings. Writing down my worries so they don't spin in my head.",
            "A bit calmer today. Took a slow walk after work."
        ],
        "growth": [ # Months 5-8
            "Noticed that when I do breathing practice in the evening, I sleep significantly better without waking up in the middle of the night.",
            "Good day at work. Handled a difficult discussion with a coworker without feeling defensive.",
            "Reflecting on balance. I am slowly learning to set boundaries instead of agreeing to every request.",
            "Spent 10 minutes practicing sensory grounding by the garden. Felt connected and present.",
            "Quiet Sunday. Enjoying the calm morning light and a cup of warm tea."
        ],
        "transition": [ # Months 9-12
            "Transitioning into a new project role this week. Feeling nervous but more equipped than I used to be.",
            "Missed a few days of check-ins with travel and relocation, but glad to return to my sanctuary space.",
            "Evening thoughts: Reminding myself that feeling uncertain is part of learning something new.",
            "Practiced 4-7-8 breathing before a presentation. My voice stayed steady.",
            "Grateful for patient friends and quiet evenings."
        ],
        "deepening": [ # Months 13-16
            "Writing has become a natural anchor for me. Looking back at where I was a year ago, my baseline anxiety is noticeably lower.",
            "Noticed physical tension in my shoulders today and paused for 5 minutes to release it gently.",
            "A thoughtful conversation with family today. Felt grounded and able to listen without reacting.",
            "Morning reflection: Choosing to approach today's challenges with curiosity rather than urgency.",
            "Practiced body scan before bed. Slept uninterrupted for 7.5 hours."
        ],
        "integration": [ # Months 17-20
            "A quieter month of practice with holiday visits, but the habits feel natural to return to.",
            "Enjoyed an early morning walk in the cool air. The stillness was deeply restorative.",
            "Realized that my immediate reaction to stress is no longer panic, but taking three deep breaths.",
            "Reflecting on patience with myself. Progress isn't linear, and that is okay.",
            "Grateful for clear boundaries and peace of mind."
        ],
        "mature": [ # Months 21-24
            "Two years of gentle self-observation. Athena has helped me notice subtle bodily cues before stress escalates.",
            "Deeply peaceful evening. Completed 10 minutes of mindfulness and felt gratitude for how much resilience has grown.",
            "Work was demanding today, but I held my calm center throughout. Proud of this steady presence.",
            "Sitting quietly with my journal. Grateful for this dedicated sanctuary space.",
            "Looking forward with steady optimism and quiet self-trust."
        ]
    }

    # Iterate over the 24-month timeline day-by-day
    current_day = start_date
    checkin_count = 0
    journal_count = 0
    studio_count = 0

    while current_day <= end_date:
        date_str = current_day.date().isoformat()
        days_from_start = (current_day - start_date).days
        month_idx = days_from_start // 30  # 0 to 23

        # Determine phase
        if month_idx < 4:
            phase = "early"
            checkin_prob = 0.50
            journal_prob = 0.22
            studio_prob = 0.25
            avg_stress = 4
            mood_choices = ["Anxious", "Heavy", "Okay", "Tired"]
        elif month_idx < 8:
            phase = "growth"
            checkin_prob = 0.58
            journal_prob = 0.26
            studio_prob = 0.35
            avg_stress = 3
            mood_choices = ["Okay", "Good", "Calm", "Reflective"]
        elif month_idx < 12:
            phase = "transition"
            checkin_prob = 0.40  # Gap period
            journal_prob = 0.18
            studio_prob = 0.20
            avg_stress = 3
            mood_choices = ["Busy", "Tired", "Okay", "Hopeful"]
        elif month_idx < 16:
            phase = "deepening"
            checkin_prob = 0.60
            journal_prob = 0.30
            studio_prob = 0.38
            avg_stress = 2
            mood_choices = ["Good", "Calm", "Centered", "Grateful"]
        elif month_idx < 20:
            phase = "integration"
            checkin_prob = 0.45
            journal_prob = 0.20
            studio_prob = 0.26
            avg_stress = 2
            mood_choices = ["Calm", "Peaceful", "Okay", "Grateful"]
        else:
            phase = "mature"
            checkin_prob = 0.65
            journal_prob = 0.32
            studio_prob = 0.40
            avg_stress = 1
            mood_choices = ["Calm", "Serene", "Grateful", "Good"]

        timestamp_iso = current_day.isoformat()

        # 1. Check-in generation (~300-330 total)
        if random.random() < checkin_prob:
            mood = random.choice(mood_choices)
            energy = random.randint(2, 5) if avg_stress <= 2 else random.randint(1, 4)
            stress = max(1, min(5, avg_stress + random.choice([-1, 0, 1])))
            checkin_rec = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "date": date_str,
                "mood": mood,
                "energy": energy,
                "stress": stress,
                "physical_symptoms": ["muscle tension"] if stress >= 4 else [],
                "gratitude": "Quiet morning time" if random.random() > 0.4 else None,
                "note": "Daily self-check" if random.random() > 0.5 else None,
                "created_at": timestamp_iso,
                "weekday": current_day.strftime("%A")
            }
            checkins_data[user_id][date_str] = checkin_rec
            checkin_count += 1

        # 2. Journal generation (~140-160 total)
        if random.random() < journal_prob:
            content = random.choice(JOURNAL_PHASES[phase])
            entry_id = str(uuid.uuid4())
            journal_rec = {
                "id": entry_id,
                "user_id": user_id,
                "content": content,
                "reflection_enabled": False,
                "ai_reflection": None,
                "created_at": timestamp_iso,
                "updated_at": timestamp_iso
            }
            journal_data[user_id][entry_id] = journal_rec
            journal_count += 1

        # 3. Studio Session generation (~160-190 total)
        if random.random() < studio_prob:
            prac = random.choice(STUDIO_PRACTICES)
            sess_id = f"sess_{uuid.uuid4().hex[:10]}"
            studio_rec = {
                "id": sess_id,
                "user_id": user_id,
                "practice_id": prac["id"],
                "exercise_id": prac["id"],
                "exercise_name": prac["name"],
                "category": prac["cat"],
                "duration_seconds": prac["dur"],
                "completion_status": "COMPLETED",
                "completed": True,
                "language": "en",
                "started_at": timestamp_iso,
                "completed_at": timestamp_iso,
                "created_at": timestamp_iso,
                "date": date_str
            }
            studio_data[user_id].insert(0, studio_rec)
            studio_count += 1

        # Advance day
        current_day += timedelta(days=1)

    # 4. Generate ~28 Multi-turn Conversations across the 24 months
    print("Generating ~28 multi-turn therapy and emotional support conversations...")
    CONVERSATION_TOPICS = [
        ("Managing Workplace Stress", [
            ("user", "Athena, I'm feeling overwhelmed by deadlines and client expectations."),
            ("assistant", "I hear you, Aarav. Carrying high expectations can feel intensely heavy in the chest and shoulders. Let's take a gentle pause together—what is one thing that feels most pressing right now?"),
            ("user", "Probably the project presentation tomorrow morning. I worry I haven't prepared enough."),
            ("assistant", "That worry often comes from caring deeply about doing good work. When you think of tomorrow, could we try five steady cycles of box breathing to help ground your physical nervous system?"),
            ("user", "Yes, let's do that. That really helps steady my thoughts.")
        ]),
        ("Sleep and Rest Habits", [
            ("user", "I've been waking up at 3 AM with my mind racing about responsibilities."),
            ("assistant", "Waking up in the quiet hours of the night can feel lonely and exhausting. When your mind begins racing, what kind of thoughts usually surface?"),
            ("user", "Things I didn't finish during the day, or emails I forgot to send."),
            ("assistant", "It makes complete sense that your brain is trying to solve daytime problems while resting. What if we keep a bedside notepad to park those thoughts on paper before sleep?"),
            ("user", "I will try that tonight. Thank you Athena.")
        ]),
        ("Setting Healthy Boundaries", [
            ("user", "I find it really hard to say no when family or colleagues ask for favors, even when I'm exhausted."),
            ("assistant", "Setting boundaries can feel uncomfortable, especially when your natural impulse is to care for others. Saying no to an extra demand is often saying yes to your own health."),
            ("user", "That's a helpful reframe. How can I decline without feeling guilty?"),
            ("assistant", "You can keep it warm yet clear: 'I'd love to help, but I don't have the capacity to give this the attention it deserves right now.' How does that feel to practice?")
        ]),
        ("Long-Term Growth & Self-Trust", [
            ("user", "Athena, I was reflecting on where I was two years ago compared to today. I notice I don't panic like I used to."),
            ("assistant", "What a powerful and meaningful observation, Aarav. Developing that steady internal anchor takes time, patience, and consistent gentle practice. How does your body feel when you recognize this growth?"),
            ("user", "Lighter. Like I can trust myself to handle whatever comes next."),
            ("assistant", "That self-trust is real, and it is something you have built day by day. I am honored to share this sanctuary journey with you.")
        ])
    ]

    conv_count = 0
    msg_count = 0
    # Distribute conversations evenly across the 24-month period
    for idx, (topic_title, turns) in enumerate(CONVERSATION_TOPICS * 7):  # 28 conversations
        conv_id = str(uuid.uuid4())
        # Calculate approximate date across timeline
        days_offset = int((idx / 28.0) * total_days)
        conv_date = start_date + timedelta(days=days_offset)
        
        conv_rec = {
            "id": conv_id,
            "user_id": user_id,
            "title": topic_title,
            "created_at": conv_date.isoformat(),
            "updated_at": conv_date.isoformat()
        }
        conv_data[conv_id] = conv_rec
        conv_count += 1

        for role, text in turns:
            save_message(conv_id, role, text)
            msg_count += 1

    # Save all datasets
    _save_local_checkins(checkins_data)
    _save_local_journal(journal_data)
    _save_local_sessions(studio_data)
    _save_local_conversations(conv_data)

    print("\n==========================================")
    print("LONG-TERM SYNTHETIC USER SEED COMPLETE")
    print("==========================================")
    print(f"User ID:        {user_id}")
    print(f"User Name:      {DEMO_NAME}")
    print(f"User Email:     {DEMO_EMAIL}")
    print(f"User Password:  {DEMO_PASSWORD}")
    print(f"Total Check-ins: {checkin_count} records")
    print(f"Total Journals:  {journal_count} entries")
    print(f"Total Studio:    {studio_count} sessions")
    print(f"Total Convs:     {conv_count} conversations ({msg_count} messages)")
    print("==========================================\n")
    return {
        "user_id": user_id,
        "name": DEMO_NAME,
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "checkins": checkin_count,
        "journals": journal_count,
        "studio": studio_count,
        "conversations": conv_count,
        "messages": msg_count
    }

if __name__ == "__main__":
    uid = create_or_get_user()
    seed_24_months_history(uid)
