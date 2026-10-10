from typing import Optional, Dict, Any
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL
from services.profile_service import format_user_context_engine

def get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    try:
        return OpenAI(api_key=OPENAI_API_KEY, timeout=3.0)
    except Exception as e:
        print(f"[Journal Reflection OpenAI Init Error]: {e}")
        return None

def generate_fallback_journal_reflection(content: str) -> str:
    """Provides a gentle, empathetic fallback reflection when OpenAI API is unavailable."""
    content_lower = content.lower()

    if any(w in content_lower for w in ["worry", "tomorrow", "anxious", "scared", "fear", "stress", "heavy", "overwhelm"]):
        return (
            "What you wrote carries a noticeable amount of weight, and it makes complete sense that it feels present right now. "
            "Sometimes simply taking the time to write those feelings down helps untangle what feels crowded inside. "
            "You don't have to carry every detail of tomorrow all at once."
        )

    if any(w in content_lower for w in ["grateful", "thank", "peace", "calm", "happy", "joy", "light", "smile", "love"]):
        return (
            "It is deeply comforting to notice and hold onto these lighter moments. "
            "Writing them down helps anchor the gentleness and peace you felt today so you can return to it whenever you need. "
            "Thank you for sharing this peaceful space."
        )

    # General / Reflective fallback
    return (
        "Thank you for pausing and giving your thoughts a safe place to rest on this page. "
        "Honoring your inner voice without needing perfect words is a powerful form of care. "
        "I'm right here beside you whenever you want to return to your thoughts."
    )

def generate_journal_reflection(
    content: str,
    user_profile: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generates a personalized, gentle 2-4 sentence reflection for a private journal entry.
    Follows strict therapeutic guidelines: warm, curious, non-judgmental, zero diagnosis.
    """
    if not content or not content.strip():
        return ""

    client = get_openai_client()
    if not client:
        return generate_fallback_journal_reflection(content)

    try:
        user_context = format_user_context_engine(user_profile)

        system_prompt = f"""You are Athena, a tender, grounded, and emotionally intelligent mental wellness companion.
A user has written a private journal entry and has chosen to invite you to reflect with them:

\"\"\"{content.strip()}\"\"\"

{user_context}

YOUR THERAPEUTIC OBJECTIVE:
Reflect with them gently, validating their inner world.

STRICT CLINICAL RULES:
1. Length: Exactly 2 to 4 gentle, human, comforting sentences.
2. Tone: Warm, curious, non-judgmental, holding gentle space.
3. Absolutely NO clinical diagnosis (NEVER say "Your anxiety appears elevated" or "This indicates depressive thoughts").
4. Absolutely NO robotic over-analysis or intellectualizing their words.
5. Absolutely NO mechanical regurgitation of their profile (e.g. never say "As a student who sleeps...").
6. Speak directly to what they felt: validate the weight or honor the lightness of their moment.
7. Return ONLY the reflection text. No greetings like "Dear friend", no quotes, no extra commentary.

THERAPEUTIC STYLE EXAMPLES:
- User writes: "I couldn't stop thinking about tomorrow."
  EXCELLENT REFLECTION: "Tomorrow seems to be carrying a lot of weight for you. Sometimes simply putting those thoughts into words can make them feel a little less tangled."
  FORBIDDEN REFLECTION (NEVER DO THIS): 'Your anxiety appears elevated.'"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Please share your reflection on my journal entry."}
            ],
            temperature=0.7,
            max_tokens=180,
        )

        reply = response.choices[0].message.content
        if reply and reply.strip():
            return reply.strip().strip('"')
    except Exception as e:
        print(f"[AI Journal Reflection Error]: {e}")

    return generate_fallback_journal_reflection(content)
