import os
from typing import Optional, Dict, Any, List
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
}

FALLBACK_ONBOARDING_REFLECTIONS = {
    "en": "Welcome to Athena. Thank you for taking this unhurried moment to share what you are moving through. Together, we will hold a quiet, steady space for your thoughts whenever you need room to breathe.",
    "hi": "एथेना में आपका स्वागत है। अपने जीवन के इस पल को साझा करने के लिए आपका धन्यवाद। जब भी आपको शांत चिंतन की आवश्यकता होगी, हम आपके लिए एक सुरक्षित और सौम्य स्थान बनाए रखेंगे।",
    "ta": "அதீனாவிற்கு அன்பான வரவேற்பு. உங்கள் எண்ணங்களை எங்களுடன் பகிர்ந்தமைக்கு நன்றி. உங்களுக்கு அமைதியான இடைவெளி தேவைப்படும் போதெல்லாம், ஒரு பாதுகாப்பான சூழலை நாம் உருவாக்குவோம்.",
    "te": "ఎథీనాకు స్వాగతం. మీ అనుభవాలను మాతో పంచుకున్నందుకు ధన్యవాదాలు. మీకు విశ్రాంతి మరియు ప్రశాంతత అవసరమైన ప్రతిసారీ, మేము మీకు తోడుగా ఉంటాము.",
    "mr": "अथेनामध्ये आपले मनापासून स्वागत आहे. आपले विचार आणि भावना व्यक्त केल्याबद्दल धन्यवाद. जेव्हा जेव्हा आपल्याला शांततेची गरज असेल, तेव्हा आम्ही आपल्यासाठी एक सुरक्षित जागा उपलब्ध करू.",
    "gu": "અથેનામાં આપનું હાર્દિક સ્વાગત છે. આપના વિચારો અને અનુભવો વહેંચવા બદલ આભાર. જ્યારે પણ આપને શાંતિ અને વિશ્રામની જરૂર હશે, અમે આપની સાથે રહીશું.",
}

def get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    try:
        return OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"[Onboarding Reflection OpenAI Init Error]: {e}")
        return None

def generate_onboarding_reflection(
    profile_data: Dict[str, Any],
    language: str = "en"
) -> str:
    """
    Generates a personalized, clinical-free, 2-3 sentence welcome reflection
    tailored to the user's intake responses in their chosen language.
    """
    lang_code = (language or "en").lower().split("-")[0]
    if lang_code not in FALLBACK_ONBOARDING_REFLECTIONS:
        lang_code = "en"

    fallback = FALLBACK_ONBOARDING_REFLECTIONS.get(lang_code, FALLBACK_ONBOARDING_REFLECTIONS["en"])
    client = get_openai_client()
    if not client:
        return fallback

    try:
        name = profile_data.get("display_name") or "friend"
        focus = ", ".join(profile_data.get("current_focus") or []) or "finding balance"
        style = profile_data.get("support_style") or "gentle presence"
        goal = profile_data.get("wellness_goal") or "inner calm"
        lang_name = LANGUAGE_NAMES.get(lang_code, "English")

        prompt = f"""You are Athena, an empathetic, non-diagnostic mental wellness companion.
A new user named {name} has completed their initial intake questionnaire.
- Life Focus Areas: {focus}
- Preferred Support Style: {style}
- Wellness Aspiration: {goal}
- Target Language: {lang_name}

CLINICAL GUIDELINES:
1. Warmly welcome them in 2 to 3 gentle, breathable sentences.
2. Acknowledge their intention to cultivate space and balance, honoring their pace.
3. Absolutely NO clinical diagnosis (never mention disorders or pathological labels).
4. Absolutely NO toxic positivity or empty motivational slogans.
5. MUST BE WRITTEN IN {lang_name}. Do NOT use English unless the target language is English.
6. Return ONLY the reflection text. No quotes or introductory text."""

        response = client.chat.completions.create(
            model=OPENAI_MODEL or "gpt-4o",
            messages=[
                {"role": "system", "content": "You are Athena, a compassionate therapeutic companion."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=180,
        )

        content = response.choices[0].message.content
        if content and content.strip():
            return content.strip().strip('"')
    except Exception as e:
        print(f"[Onboarding Reflection Generation Error]: {e}")

    return fallback
