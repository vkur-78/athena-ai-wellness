from typing import Optional, Dict, Any
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL
from services.profile_service import format_user_context_engine

ENERGY_LABELS = {
    1: "Running on empty",
    2: "Low",
    3: "Steady",
    4: "Good",
    5: "Full of energy"
}

STRESS_LABELS = {
    1: "Very light",
    2: "Manageable",
    3: "Noticeable",
    4: "Heavy",
    5: "Overwhelming"
}

def get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    try:
        return OpenAI(api_key=OPENAI_API_KEY, timeout=3.0)
    except Exception as e:
        print(f"[Checkin Reflection OpenAI Init Error]: {e}")
        return None

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
}

FALLBACK_CHECKIN_REFLECTIONS = {
    "en": {
        "heavy": "Thank you for checking in. Today sounds like it carried a heavy weight to carry. You don't have to carry or solve everything tonight, so please allow yourself a little gentle grace.",
        "light": "It's wonderful to notice days that feel lighter and full of life. Savoring these moments of vitality helps build steady inner grounding over time.",
        "steady": "Thank you for taking a moment to pause and check in with yourself. Honoring where you are right now helps bring steady grounding into the rest of your day.",
    },
    "hi": {
        "heavy": "चेक-इन करने के लिए धन्यवाद। आज का दिन कुछ भारी और तनावपूर्ण लग सकता है। आपको सब कुछ आज ही हल करने की आवश्यकता नहीं है, इसलिए खुद के प्रति सौम्य रहें।",
        "light": "हल्के और ऊर्जावान दिनों को महसूस करना सुखद है। इन पलों का आनंद लेने से समय के साथ आंतरिक स्थिरता और शांति बढ़ती है।",
        "steady": "रुकने और खुद से जुड़ने के लिए एक पल निकालने हेतु धन्यवाद। आप इस समय जहां भी हैं, उसे स्वीकार करना मन में एक शांत स्थिरता लाता है।",
    },
    "ta": {
        "heavy": "செக்-இன் செய்ததற்கு நன்றி. இன்றைய நாள் சற்று கடினமாக இருந்திருக்கலாம். அனைத்தையும் இன்றே சரிசெய்ய வேண்டிய அவசியமில்லை, உங்களுக்கே சிறிது அவகாசம் கொடுங்கள்.",
        "light": "மனம் இலகுவாகவும் அமைதியாகவும் இருக்கும் நாட்களை கவனிப்பது அற்புதம். இந்த அமைதியான தருணங்களை அனுபவிப்பது மனவலிமையை வளர்க்கிறது.",
        "steady": "ஒரு கணம் இடைநிறுத்தி உங்களை கவனித்துக் கொண்டதற்கு நன்றி. தற்போதைய நிலையை ஏற்றுக்கொள்வது ஒரு சீரான அமைதியை வழங்குகிறது.",
    },
    "te": {
        "heavy": "చెక్-ఇన్ చేసినందుకు ధన్యవాదాలు. ఈ రోజు కొద్దిగా బరువుగా అనిపించి ఉండవచ్చు. అన్నింటినీ ఈ రోజే పరిష్కరించాల్సిన అవసరం లేదు, మిమ్మల్ని మీరు శాంతపరచుకోండి.",
        "light": "మనసు తేలికగా మరియు సంతోషంగా ఉన్న రోజులను గుర్తించడం అద్భుతం. ఈ ప్రశాంత క్షణాలు కాలక్రమేణా అంతర్గత శక్తిని పెంచుతాయి.",
        "steady": "ఒక క్షణం ఆగి మిమ్మల్ని మీరు గమనించుకున్నందుకు ధన్యవాదాలు. మీరు ప్రస్తుతం ఉన్న స్థితిని గౌరవించడం రోజులో స్థిరత్వాన్ని తెస్తుంది.",
    },
    "mr": {
        "heavy": "चेक-इन केल्याबद्दल धन्यवाद. आजचा दिवस थोडा जड किंवा तणावपूर्ण वाटू शकतो. आजच सर्वकाही सोडवण्याची गरज नाही, स्वतःला थोडी विश्रांती द्या.",
        "light": "हलके आणि उत्साही दिवस अनुभवणे खूप छान वाटते. अशा शांत क्षणांचा आनंद घेतल्याने आंतरिक स्थिरता वाढते.",
        "steady": "एक क्षण थांबून स्वतःची विचारपूस केल्याबद्दल धन्यवाद. सध्याच्या मनस्थितीचा आदर केल्याने दिवसात शांतता आणि समतोल येतो.",
    },
    "gu": {
        "heavy": "ચેક-ઇન કરવા બદલ આભાર. આજનો દિવસ થોડો ભારે રહ્યો હોય તેવું લાગે છે. તમારે આજે જ બધું ઉકેલવાની જરૂર નથી, તેથી પોતાની જાત પ્રત્યે નમ્ર રહો.",
        "light": "હળવાશ અને શાંતિ અનુભવાતી હોય તેવા દિવસોને માણવા સુંદર છે. આ પળોને માણવાથી મનની સ્થિરતા મજબૂત બને છે.",
        "steady": "એક ક્ષણ રોકાઈને તમારી જાત સાથે જોડાવા બદલ આભાર. તમે અત્યારે જ્યાં છો તેનો સ્વીકાર કરવો મનને ઊંડી શાંતિ આપે છે.",
    },
}

def generate_fallback_reflection(
    mood: str,
    energy_level: int,
    stress_level: int,
    reflection_text: Optional[str] = None,
    language: str = "en"
) -> str:
    """Provides an empathetic, localized fallback reflection when AI service is unavailable."""
    lang_code = (language or "en").lower().split("-")[0]
    if lang_code not in FALLBACK_CHECKIN_REFLECTIONS:
        lang_code = "en"

    dict_for_lang = FALLBACK_CHECKIN_REFLECTIONS.get(lang_code, FALLBACK_CHECKIN_REFLECTIONS["en"])
    mood_lower = (mood or "").lower()

    if "difficult" in mood_lower or "low" in mood_lower or stress_level >= 4:
        return dict_for_lang["heavy"]
    if "great" in mood_lower or "good" in mood_lower:
        return dict_for_lang["light"]
    return dict_for_lang["steady"]

def generate_checkin_reflection(
    mood: str,
    energy_level: int,
    stress_level: int,
    reflection_text: Optional[str] = None,
    user_profile: Optional[Dict[str, Any]] = None,
    language: str = "en"
) -> str:
    """
    Generates a personalized, clinical, 2-3 sentence reflection based on
    the user's daily check-in and onboarding intake context in the user's language.
    """
    lang_code = (language or "en").lower().split("-")[0]
    energy_desc = ENERGY_LABELS.get(energy_level, "Steady")
    stress_desc = STRESS_LABELS.get(stress_level, "Manageable")
    
    client = get_openai_client()
    if not client:
        return generate_fallback_reflection(mood, energy_level, stress_level, reflection_text, language=lang_code)

    try:
        user_context = format_user_context_engine(user_profile)
        user_note = f'"{reflection_text.strip()}"' if reflection_text and reflection_text.strip() else "None provided"
        lang_name = LANGUAGE_NAMES.get(lang_code, "English")

        lang_instruction = ""
        if lang_code != "en":
            lang_instruction = f"""CRITICAL MULTI-LINGUAL REQUIREMENT:
The user interacts with Athena in {lang_name}.
You MUST generate the entire 2-3 sentence reflection in {lang_name} ({lang_code}).
Do NOT generate in English.
"""

        system_prompt = f"""You are Athena, a compassionate, grounded, and emotionally intelligent therapeutic companion.
A user just completed their brief 30-second daily wellness check-in:
- Overall Mood: {mood}
- Energy Level: {energy_level}/5 ({energy_desc})
- Stress Level: {stress_level}/5 ({stress_desc})
- Personal Reflection Note: {user_note}
- Target Language: {lang_name}

{user_context}

YOUR CLINICAL OBJECTIVE:
Generate a personalized, warm, and comforting reflection for this check-in.

STRICT REQUIREMENTS:
1. Length: Exactly 2 to 3 gentle, breathable sentences.
2. Tone: Warm, calm, deeply human, validating, and grounding.
3. Absolutely NO clinical diagnosis (never say "You seem to be experiencing anxiety/depression").
4. Absolutely NO generic motivational platitudes (avoid "Tomorrow is a new day", "Every cloud has a silver lining").
5. Absolutely NO mechanical regurgitation of the onboarding profile.
6. Meet them exactly where they are without toxic positivity.
{lang_instruction}
7. Return ONLY the reflection text. Do not wrap in quotes or add preamble."""

        response = client.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Please generate my daily check-in reflection in {lang_name}."}
            ],
            temperature=0.7,
            max_tokens=180,
        )

        content = response.choices[0].message.content
        if content and content.strip():
            return content.strip().strip('"')
    except Exception as e:
        print(f"[AI Checkin Reflection Error]: {e}")

    return generate_fallback_reflection(mood, energy_level, stress_level, reflection_text, language=lang_code)
