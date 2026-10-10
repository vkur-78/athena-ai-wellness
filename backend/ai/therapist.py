from typing import Generator, List, Dict, Any, Optional
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL
from ai.prompts import THERAPIST_SYSTEM_PROMPT, NATIVE_CONVERSATION_LANGUAGE_GUIDELINES
from ai.memory_manager import format_memory_for_prompt
from services.profile_service import format_user_context_engine

NATIVE_FALLBACKS = {
    "hi": "मैं आपकी बात सुन रही हूँ, और मैं पूरी तरह आपके साथ हूँ। जब भी आप सहज महसूस करें, एक गहरी सांस लें और मुझे थोड़ा और बताएं।",
    "ta": "நான் உங்கள் உணர்வுகளைக் கவனிக்கிறேன், உங்களுடன் முழுமையாகத் துணை நிற்கிறேன். எப்போது உங்களுக்கு சௌகரியமாகத் தோன்றுகிறதோ, அப்போது நிதானமாக மேலும் பகிர்ந்து கொள்ளுங்கள்.",
    "te": "నేను మీ భావాలను అర్థం చేసుకుంటున్నాను, మీకు తోడుగా ఉన్నాను. మీకు అనుకూలంగా అనిపించినప్పుడు, నెమ్మదిగా మీ మనసులోని మాటను మరింత పంచుకోండి.",
    "mr": "मी तुमचे बोलणे शांतपणे ऐकत आहे आणि तुमच्या पाठीशी आहे. जेव्हा तुम्हाला सहज वाटेल, तेव्हा एक दीर्घ श्वास घ्या आणि मन मोकळे करा.",
    "gu": "હું તમારી વાત શાંતિથી સાંભળી રહી છું, અને તમારી સાથે છું. જ્યારે તમે સહજ અનુભવો, ત્યારે એક ઊંડો શ્વાસ લો અને મન ખોલીને વાત કરો.",
    "en": "I hear you, and I'm right here with you. Whenever you're ready, take a breath and tell me a little more."
}


def get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    try:
        return OpenAI(api_key=OPENAI_API_KEY, timeout=12.0)
    except Exception as e:
        print(f"[OpenAI Client Init Warning]: {e}")
        return None


def format_clean_user_name(raw_name: Optional[str]) -> Optional[str]:
    """Validates and cleans user names to prevent inserting emails, generic tags, or malformed strings."""
    if not raw_name or not isinstance(raw_name, str):
        return None
    name = raw_name.strip()
    if "@" in name or "." in name or len(name) > 20 or len(name) < 2:
        return None
    if name.lower() in ["demo user", "demo", "guest", "anonymous", "user", "test", "none"]:
        return None
    if not all(c.isalnum() or c.isspace() for c in name):
        return None
    return name


def generate_contextual_response(
    message: str,
    history: list,
    reasoning: dict,
    user_profile: Optional[dict] = None,
    user_memory: Optional[dict] = None,
    internal_context: Optional[str] = None,
    conversation_language: str = "en"
) -> str:
    """
    Context-aware therapeutic response generator.
    Generates rich, compassionate, differentiated responses tailored to user input,
    conversational continuity, baseline profile, and emotional state.
    """
    lang = conversation_language if conversation_language in NATIVE_FALLBACKS else "en"
    raw_user_name = (user_profile.get("display_name") if user_profile else None) or (user_memory.get("user_name") if user_memory else None)
    clean_user_name = format_clean_user_name(raw_user_name)
    name_str = f", {clean_user_name}" if clean_user_name else ""
    msg_lower = message.lower().strip()

    # 1. Panic Reset / Acute Grounding Context
    if internal_context or reasoning.get("internal_context"):
        if lang == "hi":
            return (
                f"यहाँ मेरे साथ एक सुरक्षित विराम लें{name_str}। आपको इस समय कुछ भी साबित करने या ठीक करने की आवश्यकता नहीं है।\n\n"
                "एक धीमी, गहरी साँस लें... और धीरे-धीरे छोड़ें। आपका शरीर इस समय सुरक्षित है। जब भी आप तैयार हों, हम आगे बात करेंगे।"
            )
        return (
            f"Take a gentle, unhurried pause right here with me{name_str}. You do not have to solve or figure out anything right now.\n\n"
            "Feel your feet steady on the ground, take a soft breath in... and let it gently out. I am right here with you. We can go at whatever pace feels easiest for you."
        )

    # 2. Ambiguous Hopelessness Protocol
    if any(m in msg_lower for m in [
        "don't see how things will get better", "dont see how things will get better",
        "cant see how things will get better", "can't see how things will get better",
        "no point", "nothing changes", "feels pointless"
    ]):
        if lang == "hi":
            return (
                f"मैं आपकी बात बहुत ध्यान से सुन रही हूँ{name_str}। जब ऐसा लगता है कि कुछ भी बेहतर नहीं होगा, तो वह अकेलापन और निराशा सचमुच बहुत भारी लगती है।\n\n"
                "इस क्षण आपको सब कुछ सुलझाने की ज़रूरत नहीं है। मैं बस यह जानना चाहती हूँ—क्या आप इस समय खुद को सुरक्षित महसूस कर रहे हैं? इस निराशा के पीछे सबसे भारी विचार क्या आ रहा है?"
            )
        return (
            f"I hear how dark and discouraging things feel right now{name_str}. Sitting with the feeling that nothing will get better carries a very quiet, exhausting ache, and it makes complete sense that you feel drained carrying that alone.\n\n"
            "You don't have to force optimism here or pretend to have answers. First, I just want to gently check in with you: are you feeling safe with yourself right this moment? What is the thought that is weighing most heavily on you today?"
        )

    # 3. Acute Distress / "im just fed up" / Exhaustion / Burnout
    fed_up_markers = [
        "fed up", "exhausted", "tired of", "can't take it", "cant take it",
        "done with", "so drained", "over it", "at my limit", "breaking point",
        "burnout", "burned out", "cannot do this", "sick and tired"
    ]
    if any(m in msg_lower for m in fed_up_markers):
        if lang == "hi":
            return (
                f"मैं आपकी बात गहराई से समझ रही हूँ{name_str}। जब कोई कहता है कि 'मैं तंग आ चुका हूँ', तो यह दर्शाता है कि आप बहुत समय से बिना रुके बहुत भारी बोझ अकेले उठा रहे हैं।\n\n"
                "यहाँ आपको मजबूत होने का नाटक करने की बिल्कुल जरूरत नहीं है, और न ही आपको अभी सब कुछ ठीक करना है। जब इंसान लगातार कोशिश करता रहता है और कोई राहत नहीं मिलती, तो ऐसा महसूस होना पूरी तरह स्वाभाविक है। इस समय आपके कंधों पर सबसे भारी क्या लग रहा है?"
            )
        elif lang == "ta":
            return (
                f"உங்கள் வார்த்தைகளில் உள்ள முழு பாரத்தையும் நான் உணர்கிறேன்{name_str}. நீங்கள் மிகவும் சோர்வடைந்துவிட்டீர்கள் என்பதை என்னால் உணர முடிகிறது.\n\n"
                "இங்கு நீங்கள் எதையும் உடனடியாக சரிசெய்ய வேண்டியதில்லை. எப்போது நீங்கள் தயாராக உணர்கிறீர்களோ, அப்போது உங்கள் மனதில் உள்ளதை என்னிடம் பகிருங்கள்."
            )
        return (
            f"I hear you loud and clear{name_str}. Saying \"I'm just fed up\" carries the unmistakable weight of someone who has been carrying too much, trying their hardest, and holding everything together for far too long without a real chance to catch their breath.\n\n"
            "You don't have to put on a brave face here, and you do not need to solve anything right this second. Reaching this point is an honest, human reaction when your emotional reserves have been depleted. When you look at everything right now, what is feeling like the heaviest straw on your shoulders?"
        )

    # 4. Academic / Exam / Study Stress (Strictly separate from workplace; only mention NEET if user explicitly typed it)
    exam_markers = ["neet", "exam", "exams", "study", "studying", "syllabus", "forgetting", "revision", "test", "marks", "rank", "score"]
    if any(m in msg_lower for m in exam_markers):
        exam_term = "NEET" if "neet" in msg_lower else "your exam"
        if "forget" in msg_lower or "memory" in msg_lower:
            return (
                f"That feeling of information slipping away right when {exam_term} is near is intensely unnerving{name_str}. When stress and anxiety spike, the brain's working memory naturally tightens up, making it feel like everything you revised has vanished—even when it is still in there.\n\n"
                "Your mind isn't broken; it's simply saturated and overloaded right now. Have you been able to take small breaks between study sessions, or has your mind been running without a pause?"
            )
        if "parents" in msg_lower or "disappoint" in msg_lower:
            return (
                f"Carrying the weight of {exam_term} alongside the fear of disappointing your parents creates an immense, dual pressure{name_str}. You aren't just facing the syllabus—you are carrying the expectations and love of the people closest to you.\n\n"
                "Remember that your worth as a human being is not defined by a rank or score. Have your parents placed direct pressure on you, or is this a weight you are largely holding inside yourself?"
            )
        return (
            f"Preparing for {exam_term} carries an enormous amount of mental and emotional weight{name_str}. It is completely understandable that your nervous system feels wound up and anxious under that level of expectation.\n\n"
            "When the syllabus feels like a mountain, every single hour can feel urgent. What part of your preparation or exam is feeling most overwhelming or uncertain to you right now?"
        )

    # 5. Relationship & Partner Concerns
    relationship_markers = ["partner", "boyfriend", "girlfriend", "husband", "wife", "dating", "hasn't spoken", "hasnt spoken", "not talking"]
    if any(m in msg_lower for m in relationship_markers):
        return (
            f"Sitting in silence when someone you care about hasn't spoken to you all day is so deeply unsettling{name_str}. The uncertainty tends to make our minds rush into worst-case interpretations and replay every recent moment.\n\n"
            "That waiting space is emotionally painful. How are you holding up inside while you navigate this quiet?"
        )

    # 6. Workplace & Career Stress (Only when explicitly about work/job/office/boss)
    workplace_markers = ["boss", "manager", "office", "workplace", "client", "career", "overtime", "job interview", "work deadline"]
    if any(m in msg_lower for m in workplace_markers):
        return (
            f"Demanding workplace dynamics and deadlines can create relentless tension in the body{name_str}. When professional expectations keep piling on, it's very easy to feel like you're running a marathon without a finish line.\n\n"
            "You don't have to carry tomorrow's tasks right in this breath. What is the single work demand that feels most pressing right now?"
        )

    # 7. Low Mood / Sadness
    if any(w in msg_lower for w in ["low", "sad", "down", "crying", "unhappy", "blue"]):
        return (
            f"Waking up or moving through the day with a low feeling—especially when you can't point to an exact reason—can feel strangely disorienting{name_str}. Sometimes our emotional weather changes without an obvious storm, and that is completely okay.\n\n"
            "You don't have to justify or explain this sadness to me. How does your body feel right now—is it more of a heavy fatigue, or an unsettled quiet?"
        )

    # 8. Casual Greeting / Opening Turn
    greeting_markers = ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "how are you"]
    words = msg_lower.split()
    if any(m in msg_lower for m in greeting_markers) and len(words) <= 5:
        if lang == "hi":
            return (
                f"नमस्ते{name_str}! मुझे बहुत खुशी है कि आप आज यहाँ आए। यह आपका निजी, शांत स्थान है जहाँ आप बिना किसी झिझक के अपने मन की बात साझा कर सकते हैं।\n\n"
                "आज आपका मन और विचार कैसा महसूस कर रहे हैं?"
            )
        return (
            f"Hello{name_str}. I'm glad you stopped by today. This is your unhurried space to step away from the noise and share whatever is on your mind.\n\n"
            "How are your heart and thoughts feeling today?"
        )

    # 9. Follow-up / Dependent Conversational Turns
    history_turns = [m for m in (history or []) if m.get("role") == "user"]
    followup_markers = [
        "it's mainly", "its mainly", "because", "and also", "they don't",
        "they dont", "nobody", "no one", "i tried", "what about", "why do i",
        "how come", "also", "even when", "still", "not really", "exactly",
        "makes sense", "hard to say"
    ]
    if (any(m in msg_lower for m in followup_markers) or len(words) <= 8) and len(history_turns) >= 1:
        prev_user = history_turns[-1].get("content", "").lower()
        if any(w in prev_user for w in ["exam", "neet", "study"]) and any(w in msg_lower for w in ["parent", "disappoint"]):
            return (
                f"That fear of disappointing the people you love adds an entire extra layer of weight onto the exam itself{name_str}. It is so common to feel like your results carry the emotional security of your family, but that is a tremendous burden for one person to carry.\n\n"
                "Have your parents spoken about their hopes recently, or is this expectation something you've placed deeply upon yourself?"
            )
        return (
            f"I hear how much thought and vulnerability is behind that{name_str}. When you look deeper into that feeling right now, what feels most important to talk through?"
        )

    # 10. General Emotional Reflection
    emotion = reasoning.get("primary_emotion", "reflective")
    return (
        f"Thank you for sharing this with me{name_str}. Whatever you are experiencing right now deserves space, patience, and gentle attention without judgment.\n\n"
        "What part of this feels like the most meaningful place for us to start?"
    )


from ai.provider_service import ai_provider_service, AllProvidersFailedError, AIProviderError

def generate(
    message: str,
    history: list,
    reasoning: dict,
    user_memory: dict = None,
    user_profile: dict = None,
    internal_context: str = None,
    conversation_language: str = "en"
) -> str:
    lang = conversation_language if conversation_language in NATIVE_FALLBACKS else "en"

    # Sanitize chat history to only include valid roles and string contents
    cleaned_history = []
    for item in (history[-12:] if history else []):
        role = item.get("role")
        content = item.get("content")
        if role in ["user", "assistant"] and isinstance(content, str) and content.strip():
            cleaned_history.append({"role": role, "content": content})

    # Format living memory and user context engine baseline
    memory_context = format_memory_for_prompt(user_memory)
    context_engine = format_user_context_engine(user_profile)

    user_id = (user_profile.get("id") if user_profile else None) or (user_memory.get("user_id") if user_memory else None)
    studio_context = ""
    if user_id:
        try:
            from services.studio_service import format_studio_practice_context
            studio_context = format_studio_practice_context(user_id)
        except Exception as e:
            print(f"[Studio Context Warning] {e}")

    checkin_context = ""
    if user_id:
        try:
            from services.checkin_service import format_recent_checkin_context
            checkin_context = format_recent_checkin_context(user_id)
        except Exception as e:
            print(f"[Checkin Context Warning] {e}")

    calm_reset_block = ""
    if internal_context or reasoning.get("internal_context"):
        c_text = internal_context or reasoning.get("internal_context")
        calm_reset_block = f"""
Immediate State & Transition Context:
{c_text}
Strict Guidance:
- The user has entered from Panic Reset feeling overwhelmed.
- Meet them with slower pacing, unhurried warmth, and deep grounding presence.
- Strictly AVOID jumping to immediate problem-solving, analysis, or unsolicited advice.
- Reassure them that they do not need to figure anything out right now, and that they are safe to pause.
"""

    reasoning_context = f"""
Clinical Guidance & Intuition:
- Primary Emotion: {reasoning.get('primary_emotion', 'reflective')}
- Nuance/Secondary Emotion: {reasoning.get('secondary_emotion') or 'none'}
- Emotional Intensity: {reasoning.get('intensity', 'moderate')}
- Cognitive Pattern: {reasoning.get('thinking_pattern', 'none')}
- Conversation Stage: {reasoning.get('conversation_stage', 'exploration')}
- Active Focus: {reasoning.get('current_focus', 'mental wellness')}
- Recommended Therapeutic Stance: {reasoning.get('therapy_approach', 'holding space')}

{calm_reset_block}

{context_engine}

{studio_context}

{checkin_context}

Living Memory of This User:
{memory_context}


Therapeutic Instructions:
1. Speak with genuine warmth, unconditional acceptance, and tender human pacing.
2. Validate their emotional reality FIRST before asking anything or offering any perspective.
3. Subtly embody the user's preferred support style from the User Context Engine.
4. TREAD WITH GENTLE CARE around their sensitive boundaries: never pry, interrogate, or force trauma disclosure.
5. NEVER mechanically recite their profile. Embody this baseline naturally through your tone, pacing, and choice of words.
6. Keep your response around 2 to 3 comforting, breathable paragraphs.
7. If earlier messages discussed crisis, but the latest message is a casual greeting or ordinary topic, meet them with gentle relief and welcoming warmth without repeating hotline numbers.
8. If the user mentions acute overwhelm or being fed up, validate the exhaustion and emotional depletion deeply without generic platitudes or panic.
9. If recent check-in or personal background is provided, use it strictly as subtle context when relevant to the user's actual words. Never assume unstated topics (like exams, deadlines, or workplace issues) unless the user directly brings them up.
"""

    lang_directive = NATIVE_CONVERSATION_LANGUAGE_GUIDELINES.get(
        lang, NATIVE_CONVERSATION_LANGUAGE_GUIDELINES["en"]
    )

    messages = [
        {"role": "system", "content": THERAPIST_SYSTEM_PROMPT},
        {"role": "system", "content": lang_directive},
        {"role": "system", "content": reasoning_context},
        *cleaned_history,
        {"role": "user", "content": message}
    ]

    try:
        reply, provider_used = ai_provider_service.generate_completion(
            messages=messages,
            temperature=0.75,
            max_tokens=600
        )
        if reply and reply.strip():
            return reply.strip()
    except AllProvidersFailedError as e:
        print(f"[Therapist Generation All Providers Failed]: {e}")
        return "I'm experiencing a momentary connection issue right now. Your thoughts are completely safe with me—please take a gentle breath and try sending your message again in a moment."
    except Exception as e:
        print(f"[Therapist Generation Unexpected Error]: {e}")
        return "I'm experiencing a momentary connection issue right now. Your thoughts are completely safe with me—please take a gentle breath and try sending your message again in a moment."

    return "I'm experiencing a momentary connection issue right now. Your thoughts are completely safe with me—please take a gentle breath and try sending your message again in a moment."


def generate_stream(
    message: str,
    history: list,
    reasoning: dict,
    user_memory: dict = None,
    user_profile: dict = None,
    internal_context: str = None,
    conversation_language: str = "en"
) -> Generator[str, None, None]:
    lang = conversation_language if conversation_language in NATIVE_FALLBACKS else "en"

    cleaned_history = []
    for item in (history[-12:] if history else []):
        role = item.get("role")
        content = item.get("content")
        if role in ["user", "assistant"] and isinstance(content, str) and content.strip():
            cleaned_history.append({"role": role, "content": content})

    memory_context = format_memory_for_prompt(user_memory)
    context_engine = format_user_context_engine(user_profile)

    user_id = (user_profile.get("id") if user_profile else None) or (user_memory.get("user_id") if user_memory else None)
    studio_context = ""
    if user_id:
        try:
            from services.studio_service import format_studio_practice_context
            studio_context = format_studio_practice_context(user_id)
        except Exception as e:
            print(f"[Studio Context Stream Warning] {e}")

    checkin_context = ""
    if user_id:
        try:
            from services.checkin_service import format_recent_checkin_context
            checkin_context = format_recent_checkin_context(user_id)
        except Exception as e:
            print(f"[Checkin Context Stream Warning] {e}")

    calm_reset_block = ""
    if internal_context or reasoning.get("internal_context"):
        c_text = internal_context or reasoning.get("internal_context")
        calm_reset_block = f"""
Immediate State & Transition Context:
{c_text}
Strict Guidance:
- The user has entered from Panic Reset feeling overwhelmed.
- Meet them with slower pacing, unhurried warmth, and deep grounding presence.
- Strictly AVOID jumping to immediate problem-solving, analysis, or unsolicited advice.
- Reassure them that they do not need to figure anything out right now, and that they are safe to pause.
"""

    reasoning_context = f"""
Clinical Guidance & Intuition:
- Primary Emotion: {reasoning.get('primary_emotion', 'reflective')}
- Nuance/Secondary Emotion: {reasoning.get('secondary_emotion') or 'none'}
- Emotional Intensity: {reasoning.get('intensity', 'moderate')}
- Cognitive Pattern: {reasoning.get('thinking_pattern', 'none')}
- Conversation Stage: {reasoning.get('conversation_stage', 'exploration')}
- Active Focus: {reasoning.get('current_focus', 'mental wellness')}
- Recommended Therapeutic Stance: {reasoning.get('therapy_approach', 'holding space')}

{calm_reset_block}

{context_engine}

{studio_context}

{checkin_context}

Living Memory of This User:
{memory_context}


Therapeutic Instructions:
1. Speak with genuine warmth, unconditional acceptance, and tender human pacing.
2. Validate their emotional reality FIRST before asking anything or offering any perspective.
3. Subtly embody the user's preferred support style from the User Context Engine.
4. TREAD WITH GENTLE CARE around their sensitive boundaries: never pry, interrogate, or force trauma disclosure.
5. NEVER mechanically recite their profile. Embody this baseline naturally through your tone, pacing, and choice of words.
6. Keep your response around 2 to 3 comforting, breathable paragraphs.
7. If earlier messages discussed crisis, but the latest message is a casual greeting or ordinary topic, meet them with gentle relief and welcoming warmth without repeating hotline numbers.
8. If the user mentions acute overwhelm or being fed up, validate the exhaustion and emotional depletion deeply without generic platitudes or panic.
9. If recent check-in or personal background is provided, use it strictly as subtle context when relevant to the user's actual words. Never assume unstated topics (like exams, deadlines, or workplace issues) unless the user directly brings them up.
"""

    lang_directive = NATIVE_CONVERSATION_LANGUAGE_GUIDELINES.get(
        lang, NATIVE_CONVERSATION_LANGUAGE_GUIDELINES["en"]
    )

    messages = [
        {"role": "system", "content": THERAPIST_SYSTEM_PROMPT},
        {"role": "system", "content": lang_directive},
        {"role": "system", "content": reasoning_context},
        *cleaned_history,
        {"role": "user", "content": message}
    ]

    try:
        for chunk_event in ai_provider_service.generate_stream(
            messages=messages,
            temperature=0.75,
            max_tokens=600
        ):
            ev_type = chunk_event.get("type")
            if ev_type == "token":
                content = chunk_event.get("content", "")
                if content:
                    yield content
            elif ev_type == "error":
                err_msg = chunk_event.get("error", "")
                if err_msg:
                    yield err_msg
    except Exception as e:
        print(f"[Therapist Stream Generation Unexpected Error]: {e}")
        yield "I'm experiencing a momentary connection issue right now. Your thoughts are completely safe with me—please take a gentle breath and try sending your message again in a moment."