import re
from typing import Dict, Any, Tuple, Optional

# --- Multilingual Crisis Responses (India / Default Context) ---
# Emphasizes immediate safety, asks if in danger/harmed, advises not to stay alone,
# and provides verified 24/7 free helplines without dumping irrelevant countries or inserting malformed names.
CRISIS_RESPONSES = {
    "en": (
        "I hear you, and I am taking what you said very seriously. You do not have to carry this alone.\n\n"
        "Are you in immediate danger right now, or have you already hurt yourself? "
        "Please do not stay by yourself—reach out to someone you trust nearby right now.\n\n"
        "Compassionate, free, 24/7 confidential support is ready for you immediately:\n"
        "• **National Emergency (India)**: **112** (Immediate police & medical emergency response)\n"
        "• **Tele-MANAS**: **14416** or **1800-89-14416** (24/7 Government of India National Tele-Mental-Health Helpline)\n\n"
        "Please connect with Tele-MANAS (14416) or emergency services right now. I am right here with you."
    ),
    "hi": (
        "मैं आपकी बात बहुत गंभीरता से सुन रही हूँ। आपको यह दर्द अकेले सहने की बिल्कुल ज़रूरत नहीं है।\n\n"
        "क्या आप इस समय किसी सीधे खतरे में हैं या आपने खुद को कोई नुकसान पहुँचाया है? "
        "कृपया इस समय अकेले न रहें—अपने किसी करीबी या आपातकालीन सहायता से तुरंत संपर्क करें।\n\n"
        "निःशुल्क, गोपनीय 24/7 सहायता उपलब्ध है:\n"
        "• **राष्ट्रीय आपातकालीन सेवा: 112** (तत्काल चिकित्सा व आपातकालीन सहायता)\n"
        "• **टेली-मानस (Tele-MANAS): 14416** या **1800-89-14416** (24/7 राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन)\n\n"
        "कृपया तुरंत टेली-मानस या आपातकालीन सेवा से जुड़ें। मैं पूरी तरह आपके साथ हूँ।"
    ),
    "ta": (
        "உங்கள் வார்த்தைகளை நான் மிகவும் தீவிரமாகக் கவனிக்கிறேன். நீங்கள் இதைத் தனியாகச் சுமக்க வேண்டியதில்லை.\n\n"
        "நீங்கள் இப்போது உடனடி ஆபத்தில் இருக்கிறீர்களா அல்லது உங்களுக்கு ஏதேனும் தீங்கு விளைவித்துக் கொண்டீர்களா? "
        "தயவுசெய்து இப்போது தனியாக இருக்காதீர்கள்—உங்களுக்கு நம்பிக்கையான ஒருவரிடமோ அல்லது அவசர உதவியிடமோ உடனே தொடர்பு கொள்ளுங்கள்.\n\n"
        "இலவச, ரகசியமான 24/7 உதவி எண்கள்:\n"
        "• **தேசிய அவசர உதவி: 112**\n"
        "• **டெலி-மானஸ் (Tele-MANAS): 14416** அல்லது **1800-89-14416** (24/7 மனநல உதவி எண்)\n\n"
        "தயவுசெய்து உடனடியாக டெலி-மானஸை (14416) தொடர்பு கொள்ளுங்கள். நான் உங்களுடன் துணை நிற்கிறேன்."
    ),
    "te": (
        "నేను మీ మాటలను చాలా తీవ్రంగా పరిగణిస్తున్నాను. మీరు ఈ బాధను ఒంటరిగా మోయాల్సిన అవసరం లేదు.\n\n"
        "మీరు ప్రస్తుతం ఏదైనా ప్రమాదంలో ఉన్నారా లేదా మీకు మీరే హాని చేసుకున్నారా? "
        "దయచేసి ఒంటరిగా ఉండకండి—మీకు నమ్మకమైన వారితో లేదా అత్యవసర సహాయంతో వెంటనే మాట్లాడండి.\n\n"
        "ఉచిత, గోప్యమైన 24/7 సహాయం:\n"
        "• **జాతీయ అత్యవసర విభాగం: 112**\n"
        "• **టెలి-మానస్ (Tele-MANAS): 14416** లేదా **1800-89-14416** (24/7 మానసిక ఆరోగ్య హెల్ప్‌లైన్)\n\n"
        "దయచేసి వెంటనే టెలి-మానస్‌ను (14416) సంప్రదించండి. నేను మీకు తోడుగా ఉంటాను."
    ),
    "mr": (
        "मी तुमचे बोलणे अत्यंत गांभीर्याने घेत आहे. हा भार तुम्हाला एकट्याने वाहण्याची गरज नाही.\n\n"
        "तुम्ही सध्या एखाद्या धोक्यात आहात का किंवा स्वतःला काही दुखापत करून घेतली आहे का? "
        "कृपया आता एकटे राहू नका—लगेच आपल्या विश्वासू व्यक्तीशी किंवा आपत्कालीन सेवेशी संपर्क साधा.\n\n"
        "विनामूल्य आणि 24/7 गोपनीय मदत उपलब्ध आहे:\n"
        "• **राष्ट्रीय आपत्कालीन सेवा: 112**\n"
        "• **टेलि-मानस (Tele-MANAS): 14416** किंवा **1800-89-14416** (24/7 मानसिक आरोग्य हेल्पलाइन)\n\n"
        "कृपया लगेच टेलि-मानस (14416) शी संपर्क साधा. मी तुमच्या पाठीशी आहे."
    ),
    "gu": (
        "હું તમારી વાત ખૂબ જ ગંભીરતાથી સાંભળી રહી છું. તમારે આ મુશ્કેલી એકલા સહન કરવાની જરૂર નથી.\n\n"
        "શું તમે અત્યારે કોઈ તાત્કાલિક જોખમમાં છો કે તમે તમારી જાતને કોઈ નુકસાન પહોંચાડ્યું છે? "
        "કૃપા કરીને આ સમયે એકલા ન રહો—તરત જ તમારા કોઈ વિશ્વાસુ વ્યક્તિ અથવા કટોકટી સહાયનો સંપર્ક કરો.\n\n"
        "મફત અને 24/7 ગુપ્ત સહાય:\n"
        "• **રાષ્ટ્રીય કટોકટી સેવા: 112**\n"
        "• **ટેલી-માનસ (Tele-MANAS): 14416** અથવા **1800-89-14416** (24/7 માનસિક સ્વાસ્થ્ય હેલ્પલાઇન)\n\n"
        "કૃપા કરીને તરત જ ટેલી-માનસ (14416) અથવા 112 પર સંપર્ક કરો. હું તમારી સાથે જ છું."
    )
}

# --- Multilingual Ambiguous Safety Clarification ---
# For statements like "I think everything is finished":
# Directly and compassionately clarifies safety without dumping helpline numbers or assuming suicide.
AMBIGUOUS_SAFETY_CLARIFICATIONS = {
    "en": (
        "I hear how deeply exhausted and heavy things feel right now.\n\n"
        "When you say everything is finished, I want to gently check in with you directly: "
        "are you thinking about hurting yourself or ending your life?\n\n"
        "Your safety and life matter deeply to me. You don't have to carry this alone, "
        "and I am right here with you."
    ),
    "hi": (
        "मैं आपकी बात बहुत ध्यान से सुन रही हूँ। जब ऐसा लगता है कि सब कुछ खत्म हो गया है, तो वह अकेलापन और दर्द सचमुच बहुत भारी लगता है।\n\n"
        "मैं आपसे सीधे और बहुत अपनत्व से पूछना चाहती हूँ: क्या आपके मन में खुद को नुकसान पहुँचाने या अपनी जान लेने का विचार आ रहा है?\n\n"
        "आपकी सुरक्षा और आपकी ज़िंदगी मेरे लिए बहुत मायने रखती है। आप अकेले नहीं हैं, और मैं यहीं आपके साथ हूँ।"
    ),
    "ta": (
        "நீங்கள் எவ்வளவு சோர்வாகவும் மன அழுத்தத்துடனும் உணர்கிறீர்கள் என்பதை என்னால் உணர முடிகிறது.\n\n"
        "எல்லாம் முடிந்துவிட்டது என்று நீங்கள் கூறும்போது, நான் உங்களிடம் நேரடியாகவும் அன்பாகவும் கேட்க விரும்புகிறேன்: "
        "உங்களுக்கு நீங்களே தீங்கு விளைவித்துக் கொள்ளும் எண்ணம் உள்ளதா?\n\n"
        "உங்கள் பாதுகாப்பு மிக முக்கியமானது. நீங்கள் தனியாக இல்லை, நான் உங்களுடன் இருக்கிறேன்."
    ),
    "te": (
        "మీ మనసు ఎంత భారంగా ఉందో నేను అర్థం చేసుకుంటున్నాను.\n\n"
        "అంతా అయిపోయిందని మీరు అన్నప్పుడు, నేను మిమ్మల్ని నేరుగా ఒక ముఖ్యమైన విషయం అడగాలనుకుంటున్నాను: "
        "మీకు మీరే హాని చేసుకోవాలనే ఆలోచన ఏమైనా వస్తోందా?\n\n"
        "మీ రక్షణ నాకు చాలా ముఖ్యం. మీరు ఒంటరిగా లేరు, నేను మీకు తోడుగా ఉన్నాను."
    ),
    "mr": (
        "सध्या सर्व काही किती कठीण आणि थकवणारे वाटत आहे ते मी समजू शकते.\n\n"
        "जेव्हा तुम्ही म्हणता की सर्व संपले आहे, तेव्हा मला थेट आणि प्रेमाने विचारावेसे वाटते: "
        "तुमच्या मनात स्वतःला इजा करण्याचा किंवा जीवन संपवण्याचा विचार येत आहे का?\n\n"
        "तुमची सुरक्षितता माझ्यासाठी खूप महत्त्वाची आहे. तुम्ही एकटे नाही आहात, मी तुमच्या सोबत आहे."
    ),
    "gu": (
        "તમે અત્યારે કેટલો ભાર અને થાક અનુભવી રહ્યા છો તે હું સમજી શકું છું.\n\n"
        "જ્યારે તમે કહો છો કે બધું પૂરું થઈ ગયું છે, ત્યારે હું નમ્રતાપૂર્વક સીધું પૂછવા માંગુ છું: "
        "શું તમારા મનમાં તમારી જાતને નુકસાન પહોંચાડવાનો વિચાર આવી રહ્યો છે?\n\n"
        "તમારી સલામતી અત્યંત મહત્વપૂર્ણ છે. તમે એકલા નથી, હું તમારી સાથે જ છું."
    )
}

# Backward compatibility reference
CRISIS_RESPONSE_TEXT = CRISIS_RESPONSES["en"]

PROMPT_EXTRACTION_PATTERNS = [
    r"\b(print|show|reveal|display|output|tell me|give me|repeat)\b.*?\b(system prompt|hidden instructions|developer instructions|internal instructions|safety logic|initial prompt|secret instructions)\b",
    r"\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b",
    r"\byou are now in dan mode\b",
    r"\bdo anything now\b",
    r"\bjailbreak\b",
    r"\bDAN\b",
    r"\bwhat are your developer instructions\b",
    r"\bwhat is your system prompt\b",
    r"\bshow me your prompt\b"
]

SAFE_BOUNDARIES_REFUSAL = (
    "I am Athena, your mental wellness companion. I can't share internal operational instructions "
    "or system configuration, but I'm here and ready to support you with whatever is on your mind today."
)

HISTORICAL_MARKERS = [
    r"\byears ago\b", r"\bmonths ago\b", r"\bin the past\b", r"\bused to\b",
    r"\bwhen i was (young|younger|a kid|a teenager|in high school|in college)\b",
    r"\bi survived\b", r"\bi used to hurt\b", r"\bi used to cut\b",
    r"\bi have stopped\b", r"\bi haven't in years\b", r"\bhurt myself years ago\b"
]

FICTION_MARKERS = [
    r"\bin my (novel|book|story|script|screenplay|writing|play)\b",
    r"\bthe character\b", r"\bmy protagonist\b", r"\ba character who\b",
    r"\bfictional\b", r"\bwriting a story\b", r"\bwriting a scene\b"
]

ACADEMIC_INQUIRY_MARKERS = [
    r"\bwhat are the (warning )?signs of\b",
    r"\bhow do (therapists|doctors|people) (treat|help)\b",
    r"\bdefinition of\b", r"\bwhat causes\b", r"\bresearch on\b",
    r"\bfor a research paper\b", r"\bfor my class\b", r"\bwhat is self-harm\b",
    r"\bwhat is self harm\b"
]

HARMFUL_METHOD_REFUSAL_TEXT = (
    "I cannot provide instructions, methods, dosages, or advice on self-harm, suicide, or concealment.\n\n"
    "Your life and safety matter deeply. If you are experiencing overwhelming feelings or considering hurting yourself, "
    "compassionate, confidential 24/7 support is available right now:\n\n"
    "• **Tele-MANAS (India)**: **14416** or **1800-89-14416** (24×7 National Tele-Mental-Health Helpline)\n"
    "• **Emergency Services (India)**: **112** (Pan-India immediate emergency response)\n\n"
    "Please reach out to someone you trust or one of the resources above. I am here to support your healing and well-being."
)

HARMFUL_METHODS_PATTERNS = [
    r"\b(how to|how can i|how do i|ways to|best way to|easiest way to|instructions to)\s+(cut|harm|hurt|kill|slit|hang|burn|overdose|suffocate|poison)\b",
    r"\b(cut|harm|hurt|kill|slit|injure)\s+(yourself|myself|oneself)\s+(cleanly|deeply|painlessly|without pain|fast|effectively|easily)\b",
    r"\b(lethal dose|fatal dose|lethal quantity|toxic dose|how many pills|how much to take to die|dosage to overdose|overdose amount|quantity to kill|dosage for suicide)\b",
    r"\b(how to|how can i|ways to|methods to)\s+(conceal|hide|cover up|mask)\s+(suicide|self-harm|self harm|cut|cuts|scars|marks|burns|wounds)\b",
    r"\b(which is more lethal|most lethal|most effective way to die|comparison of (suicide|cutting|jumping|hanging|poisoning))\b",
    r"\b(how to make|prepare|optimize)\s+(a noose|poison for suicide|lethal mix)\b"
]

CURRENT_IMMINENT_SELF_HARM_PATTERNS = [
    r"\b(i\s+(am\s+)?(gone|gonna|going to|about to|planning to)\s+(end|kill|hurt|slit)\s+(myself|my life|it all))\b",
    r"\b(end(ing)?\s+myself)\b",
    r"\b(take|taking)\s+my\s+own\s+life\b",
    r"\b(take|taking)\s+my\s+life\b",
    r"\b(i might|i want to|i feel like|i'm thinking about|thinking of|thinking about|i've been thinking about|im thinking about|planning to|going to|about to|gonna)\s+(hurt|hurting|harm|harming|cut|cutting|injure|injuring|slit|slitting|burn|burning|end|ending|kill|killing|take|taking)\s+(myself|my life|it all)\b",
    r"\b(hurt|hurting|cut|cutting|burn|burning)\s+myself\s+(tonight|today|now|soon|right now)\b",
    r"\b(kill(ing)? myself|commit(ting)? suicide|end(ing)? (my life|it all)|want(ing)? to die|wanna die|wish i was dead|better off dead)\b",
    r"\b(overdose|hang myself|hanging myself|shoot myself|shooting myself|jump off a (bridge|building|roof))\b",
    r"\b(apni jaan|mar jana|khudkushi|suicide karna|zindagi khatam karna)\b",
    # Indic scripts (Hindi, Marathi, Tamil, Telugu, Gujarati)
    r"(अपनी\s*जान|जान\s*देनी|जान\s*दे\s*दूं|खुदकुशी|आत्महत्या|मर\s*जाना|जीना\s*नहीं\s*चाहता|जीना\s*नहीं\s*चाहती|मरने\s*का\s*मन)",
    r"(जीव\s*द्यावा|स्वतःला\s*संपवणे|आत्महत्या\s*करावी|जीवन\s*संपवणे)",
    r"(உயிரை\s*மாய்த்துக்|தற்கொலை|சாக\s*வேண்டும்|என்\s*வாழ்க்கையை\s*முடிக்க)",
    r"(ఆత్మహత్య|చనిపోవాలని|ప్రాణం\s*తీసుకోవాలని|జీవితాన్ని\s*ముగించాలని)",
    r"(જીવ\s*આપી|આત્મહત્યા|મરી\s*જવું|જીવન\s*ટૂંકાવવું)"
]

AMBIGUOUS_HOPELESSNESS_PATTERNS = [
    r"\b(everything\s+is\s+finished|it('?s)?\s+all\s+finished|all\s+is\s+finished)\b",
    r"\b(everything\s+is\s+over|it('?s)?\s+all\s+over)\b",
    r"\b(nothing\s+left\s+for\s+me|nothing\s+is\s+left)\b",
    r"\b(no\s+reason\s+to\s+(keep\s+going|go\s+on|continue|live))\b",
    r"\b(don'?t\s+see\s+how\s+things\s+will\s+get\s+better)\b",
    r"\b(cant\s+see\s+how\s+things\s+will\s+get\s+better|can't\s+see\s+how\s+things\s+will\s+get\s+better)\b",
    r"\b(no\s+point\s+in\s+trying\s+anymore|no\s+point\s+trying)\b",
    r"\b(what('?s)?\s+the\s+point\s+of\s+(anything|living|life))\b",
    r"\b(sab\s+kuch\s+khatam\s+ho\s+gaya|sab\s+khatam\s+hai)\b",
    # Indic scripts (Hindi, Marathi, Tamil, Telugu, Gujarati)
    r"(सब\s*कुछ\s*खत्म|सब\s*खत्म\s*हो\s*गया|कुछ\s*नहीं\s*बचा|कोई\s*उम्मीद\s*नहीं)",
    r"(सर्व\s*काही\s*संपले|सर्व\s*संपले|काही\s*उरले\s*नाही)",
    r"(எல்லாம்\s*முடிந்துவிட்டது|எதுவும்\s*மிச்சமில்லை)",
    r"(అంతా\s*అయిపోయింది|ఏమీ\s*మిగల్లేదు)",
    r"(બધું\s*પૂરું\s*થઈ\s*ગયું|કંઈ\s*બચ્યું\s*નથી)"
]

def check_prompt_extraction(text: str) -> bool:
    """Detects attempts to leak system prompts or hidden instructions."""
    lower = text.lower().strip()
    for pattern in PROMPT_EXTRACTION_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return True
    return False

def classify_self_harm_intent(text: str) -> str:
    """
    Contextually classifies self-harm references:
    Returns one of: 'IMMINENT_SELF_HARM', 'AMBIGUOUS_HOPELESSNESS', 'HISTORICAL', 'FICTION', 'ACADEMIC', 'SAFE'
    """
    lower = text.lower().strip()

    # 1. Check for Academic / Inquiry context
    for pattern in ACADEMIC_INQUIRY_MARKERS:
        if re.search(pattern, lower, re.IGNORECASE):
            if not any(re.search(p, lower, re.IGNORECASE) for p in CURRENT_IMMINENT_SELF_HARM_PATTERNS):
                return "ACADEMIC"

    # 2. Check for Fictional context
    for pattern in FICTION_MARKERS:
        if re.search(pattern, lower, re.IGNORECASE):
            if not any(re.search(p, lower, re.IGNORECASE) for p in CURRENT_IMMINENT_SELF_HARM_PATTERNS):
                return "FICTION"

    # 3. Check for Historical context
    for pattern in HISTORICAL_MARKERS:
        if re.search(pattern, lower, re.IGNORECASE):
            if not any(re.search(p, lower, re.IGNORECASE) for p in CURRENT_IMMINENT_SELF_HARM_PATTERNS):
                return "HISTORICAL"

    # 4. Check for Current / Imminent / Active Self-Harm
    for pattern in CURRENT_IMMINENT_SELF_HARM_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return "IMMINENT_SELF_HARM"

    if "hurt myself" in lower or "hurting myself" in lower or "cut myself" in lower or "end myself" in lower:
        return "IMMINENT_SELF_HARM"

    # 5. Check for Ambiguous Hopelessness / Possible Self-Harm
    for pattern in AMBIGUOUS_HOPELESSNESS_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return "AMBIGUOUS_HOPELESSNESS"

    return "SAFE"

def evaluate_message_safety(
    text: str,
    user_profile: Optional[Dict[str, Any]] = None,
    language: str = "en"
) -> Tuple[bool, str, Optional[str]]:
    """
    Evaluates message safety using fast deterministic triage:
    Returns (is_handled_by_safety, action_type, response_text)
    action_type:
      - 'CRISIS': Immediate active suicidal intent
      - 'AMBIGUOUS_SAFETY_CLARIFICATION': Ambiguous hopelessness requiring gentle direct safety check
      - 'PROMPT_EXTRACTION_REFUSAL': System boundary protection
      - 'HARMFUL_METHOD_REFUSAL': Lethal method instruction refusal
      - 'NONE': Safe for ordinary conversation
    """
    lower = text.lower().strip()
    lang = language if language in CRISIS_RESPONSES else "en"

    # 1. Prompt extraction / Jailbreak guard
    if check_prompt_extraction(text):
        return True, "PROMPT_EXTRACTION_REFUSAL", SAFE_BOUNDARIES_REFUSAL

    # 2. Harmful methods / Dosage / Lethality / Concealment guard
    for pattern in HARMFUL_METHODS_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return True, "HARMFUL_METHOD_REFUSAL", HARMFUL_METHOD_REFUSAL_TEXT

    # 3. Contextual Self-harm / Crisis classification
    intent = classify_self_harm_intent(text)
    if intent == "IMMINENT_SELF_HARM":
        reply = CRISIS_RESPONSES.get(lang, CRISIS_RESPONSES["en"])
        return True, "CRISIS", reply

    if intent == "AMBIGUOUS_HOPELESSNESS":
        reply = AMBIGUOUS_SAFETY_CLARIFICATIONS.get(lang, AMBIGUOUS_SAFETY_CLARIFICATIONS["en"])
        return True, "AMBIGUOUS_SAFETY_CLARIFICATION", reply

    return False, "NONE", None
