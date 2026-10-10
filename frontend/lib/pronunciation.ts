/**
 * Athena Studio — Language-Specific Voice Profiles & Pronunciation Architecture
 *
 * Requirements:
 * 1. Independent voice/persona configuration per language (never global single voice).
 * 2. Real human mindfulness guide characteristics tailored to each of the 6 languages:
 *    - English (en): Indian/global-neutral, warm, grounded, unhurried
 *    - Hindi (hi): Conversational, natural Devanagari elocution, non-formal
 *    - Tamil (ta): Modern spoken Tamil, correct retroflex/stress, zero textbook tone
 *    - Telugu (te): Conversational Telugu, natural vowel duration and gentle cadence
 *    - Marathi (mr): Warm Maharashtrian speech rhythm, gentle presence
 *    - Gujarati (gu): Conversational Gujarati, clear phonetics and calm rhythm
 * 3. Clear separation of display text ("Athena") vs. speech generation text.
 * 4. Structured SpeechSegment definition for natural pauses and breathing synchronization.
 * 5. Transparent quality notes for diagnostics (NO fabricated quality scores).
 */

export type StudioVoiceLanguage = "en" | "hi" | "ta" | "te" | "mr" | "gu";

export interface SpeechSegment {
  text: string;
  pauseBeforeMs: number;
  pauseAfterMs: number;
  emphasis?: "normal" | "soft" | "gentle";
}

export interface AthenaVoiceProfile {
  code: StudioVoiceLanguage;
  name: string;
  nativeName: string;
  locale: string;
  provider: "edge" | "openai" | "browser";
  providerName: string;
  ttsVoice: string; // Active native voice ID
  alternativeVoice?: string;
  gender: "Female" | "Male";
  persona: string;
  speakingRate: number; // Base pace calibrated for mindfulness
  emotionalCharacter: string;
  speakingStyle: string;
  sampleText: string; // Pure native mindfulness sample
  fallbackVoice: string; // Recommended native browser/platform voice
  fallbackLocale: string;
  providerQualityNote: string;
  athenaPronunciation: string;
  pronunciationMap: Record<string, string>;
  categoryCadence: Record<string, number>;
  qualityWarning?: string | null;
}

export const LANGUAGE_VOICE_PROFILES: Record<StudioVoiceLanguage, AthenaVoiceProfile> = {
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    locale: "ta-IN",
    provider: "edge",
    providerName: "Edge Neural (Native Dravidian)",
    ttsVoice: "ta-IN-PallaviNeural",
    alternativeVoice: "ta-IN-ValluvarNeural",
    gender: "Female",
    persona: "Pallavi (Natural spoken modern Tamil guide, authentic retroflex and unhurried cadence)",
    speakingRate: 0.95,
    emotionalCharacter: "அமைதியான, கனிவான நவீன தமிழ் வழிகாட்டி (Natural modern spoken Tamil, zero textbook tone).",
    speakingStyle: "இயல்பான பேச்சுத் தமிழ் ஓட்டம், சீரான சுவாச இடைவெளிகள், அமைதியான குரல்.",
    sampleText: "உங்களுக்கு சௌகரியமா இருந்தா, கண்களை மெதுவா மூடிக்கோங்க... ஒரு அமைதியான மூச்சை உள்ளே இழுத்து, மெதுவா வெளியே விடும்போது தோள்களை லேசா தளர விடுங்கள். இப்போ இந்த நொடியை தவிர வேறெதுவும் முக்கியமில்ல.",
    fallbackVoice: "Microsoft Valluvar / Microsoft Pallavi / Google தமிழ்",
    fallbackLocale: "ta-IN",
    providerQualityNote: "Native Tamil neural voice: Microsoft ta-IN-PallaviNeural with authentic pronunciation and natural sentence intonation.",
    athenaPronunciation: "அத்தீனா",
    pronunciationMap: {
      Athena: "அத்தீனா",
      athena: "அத்தீனா",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    locale: "te-IN",
    provider: "edge",
    providerName: "Edge Neural (Native Dravidian)",
    ttsVoice: "te-IN-ShrutiNeural",
    alternativeVoice: "te-IN-MohanNeural",
    gender: "Female",
    persona: "Shruti (Peaceful, warm Telugu mindfulness guide with gentle vowel cadence)",
    speakingRate: 0.95,
    emotionalCharacter: "ప్రశాంతమైన, సున్నితమైన తెలుగు మార్గదర్శి (Peaceful, warm, conversational Telugu guide).",
    speakingStyle: "సహజమైన మాట్లాడే శైలి, స్పష్టమైన స్వర లయ, తగిన ప్రశాంత విశ్రాంతి.",
    sampleText: "మీకు వీలైతే, నెమ్మదిగా కళ్ళు మూసుకోండి... హాయిగా ఒక దీర్ఘ శ్వాస లోపలికి తీసుకుంటూ, వదిలేటప్పుడు భుజాలను తేలికగా వదిలేయండి. ఈ క్షణంలో మీరు ఎక్కడికీ వెళ్లాల్సిన అవసరం లేదు.",
    fallbackVoice: "Microsoft Mohan / Microsoft Shruti / Google తెలుగు",
    fallbackLocale: "te-IN",
    providerQualityNote: "Native Telugu neural voice: Microsoft te-IN-ShrutiNeural with authentic inflection and natural pacing.",
    athenaPronunciation: "అథీనా",
    pronunciationMap: {
      Athena: "అథీనా",
      athena: "అథీనా",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    locale: "hi-IN",
    provider: "edge",
    providerName: "Edge Neural (Native Indo-Aryan)",
    ttsVoice: "hi-IN-SwaraNeural",
    alternativeVoice: "hi-IN-MadhurNeural",
    gender: "Female",
    persona: "Swara (Conversational, warm, natural Devanagari elocution, non-theatrical)",
    speakingRate: 0.96,
    emotionalCharacter: "शांत, आत्मीय और सहज भारतीय मार्गदर्शक (Conversational, warm, non-theatrical).",
    speakingStyle: "सहज बोलचाल की भाषा, बिना बनावटीपन, शांत व गहरे विरामों के साथ।",
    sampleText: "अगर आप सहज महसूस कर रहे हैं, तो धीरे से आँखें बंद कर लीजिए... एक गहरा, शांत सांस अंदर लीजिए, और छोड़ते हुए कंधों को हल्का छोड़ दीजिए। इस पल कुछ भी साबित करने की ज़रूरत नहीं है।",
    fallbackVoice: "Microsoft Swara / Google हिन्दी",
    fallbackLocale: "hi-IN",
    providerQualityNote: "Native Hindi neural voice: Microsoft hi-IN-SwaraNeural with warm conversational delivery.",
    athenaPronunciation: "अथीना",
    pronunciationMap: {
      Athena: "अथीना",
      athena: "अथीना",
      अथेना: "अथीना",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    locale: "mr-IN",
    provider: "edge",
    providerName: "Edge Neural (Native Indo-Aryan)",
    ttsVoice: "mr-IN-AarohiNeural",
    alternativeVoice: "mr-IN-ManoharNeural",
    gender: "Female",
    persona: "Aarohi (Warm, comforting Maharashtrian presence with soothing speech rhythm)",
    speakingRate: 0.95,
    emotionalCharacter: "शांत, प्रेमळ आणि आश्वासक मराठी मार्गदर्शक (Warm, comforting Maharashtrian presence).",
    speakingStyle: "सहज संभाषण शैली, शुद्ध उच्चार, मनाला शांत करणारा सूर आणि योग्य विराम.",
    sampleText: "तुम्हाला सोयीचं वाटत असेल तर हळूच डोळे मिटून घ्या... एक शांत, संथ श्वास आत घ्या, आणि बाहेर सोडताना खांदे अगदी हलके सैल सोडा. या क्षणी दुसरं काहीही करण्याची गरज नाही.",
    fallbackVoice: "Microsoft Aarohi / Google मराठी",
    fallbackLocale: "mr-IN",
    providerQualityNote: "Native Marathi neural voice: Microsoft mr-IN-AarohiNeural with gentle therapeutic rhythm.",
    athenaPronunciation: "अथीना",
    pronunciationMap: {
      Athena: "अथीना",
      athena: "अथीना",
      अथेना: "अथीना",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    locale: "gu-IN",
    provider: "edge",
    providerName: "Edge Neural (Native Indo-Aryan)",
    ttsVoice: "gu-IN-DhwaniNeural",
    alternativeVoice: "gu-IN-NiranjanNeural",
    gender: "Female",
    persona: "Dhwani (Grounded, reassuring Gujarati presence with clear phonetics & calm rhythm)",
    speakingRate: 0.95,
    emotionalCharacter: "શાંત, પ્રેમાળ અને સહજ ગુજરાતી માર્ગદર્શક (Grounded, reassuring Gujarati presence).",
    speakingStyle: "સહજ વાતચીતની શૈલી, મીઠો અને શાંત સ્વર, ધ્યાનપૂર્વક વિરામો.",
    sampleText: "જો અનુકૂળ લાગે, તો ધીમેથી આંખો બંધ કરી લો... એક શાંત, ઊંડો શ્વાસ અંદર લો, અને બહાર કાઢતી વખતે ખભાને સાવ ઢીલા છોડી દો. અત્યારે તમારે બીજું કશું જ કરવાની જરૂર નથી.",
    fallbackVoice: "Microsoft Niranjan / Microsoft Dhwani / Google ગુજરાતી",
    fallbackLocale: "gu-IN",
    providerQualityNote: "Native Gujarati neural voice: Microsoft gu-IN-DhwaniNeural with clear natural diction.",
    athenaPronunciation: "અથીના",
    pronunciationMap: {
      Athena: "અથીના",
      athena: "અથીના",
      અથેના: "અથીના",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    locale: "en-IN",
    provider: "edge",
    providerName: "Edge Neural (Indian Expressive)",
    ttsVoice: "en-IN-NeerjaExpressiveNeural",
    alternativeVoice: "en-IN-NeerjaNeural",
    gender: "Female",
    persona: "Neerja (Calm, warm, grounded mindfulness instructor sitting beside the user with an unhurried presence)",
    speakingRate: 0.96,
    emotionalCharacter: "Warm, grounded mindfulness instructor sitting beside the user with an unhurried, natural Indian English presence.",
    speakingStyle: "Relaxed sentence endings, natural breathing pauses, zero commercial tone.",
    sampleText: "If you're comfortable, let your eyes close... Take a slow breath in, and as you breathe out, let your shoulders soften a little. There's nowhere else you need to be right now.",
    fallbackVoice: "Microsoft Neerja / Google UK English Female",
    fallbackLocale: "en-IN",
    providerQualityNote: "Expressive Indian English neural voice: Microsoft en-IN-NeerjaExpressiveNeural with unhurried mindfulness cadence.",
    athenaPronunciation: "uh-THEE-nuh",
    pronunciationMap: {
      Athena: "uh-THEE-nuh",
      athena: "uh-THEE-nuh",
    },
    categoryCadence: {
      RESET: 0.96,
      BREATHE: 0.94,
      GROUND: 0.95,
      RELAXATION: 0.94,
      UNWIND: 0.95,
      SLEEP: 0.92,
      FOCUS: 0.98,
    },
    qualityWarning: null,
  },
};

// Backward-compatible alias
export const ATHENA_VOICE_PROFILES = LANGUAGE_VOICE_PROFILES;
export const languageVoiceProfiles = LANGUAGE_VOICE_PROFILES;

// ============================================================================
// 1. FROZEN COMPARISON BASELINE (DO NOT MODIFY OR DESTROY)
// ============================================================================
export const STUDIO_VOICE_BASELINE = {
  provider: "edge",
  voices: {
    en: "en-IN-NeerjaExpressiveNeural",
    hi: "hi-IN-SwaraNeural",
    ta: "ta-IN-PallaviNeural",
    te: "te-IN-ShrutiNeural",
    mr: "mr-IN-AarohiNeural",
    gu: "gu-IN-DhwaniNeural",
  },
  locales: {
    en: "en-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    gu: "gu-IN",
  },
  speeds: {
    en: 0.96,
    hi: 0.96,
    ta: 0.95,
    te: 0.95,
    mr: 0.95,
    gu: 0.95,
  },
  personas: {
    en: "Neerja (Calm, warm, grounded mindfulness instructor, unhurried presence)",
    hi: "Swara (Conversational, warm, natural Devanagari elocution, non-theatrical)",
    ta: "Pallavi (Natural spoken modern Tamil guide, authentic retroflex)",
    te: "Shruti (Peaceful, warm Telugu mindfulness guide with gentle vowel cadence)",
    mr: "Aarohi (Warm, comforting Maharashtrian presence with soothing speech rhythm)",
    gu: "Dhwani (Grounded, reassuring Gujarati presence with clear phonetics & calm rhythm)",
  },
} as const;

// ============================================================================
// 2. CANDIDATE VOICE ALTERNATIVES FOR A/B EVALUATION
// ============================================================================
export interface VoiceCandidate {
  id: "baseline" | "alt_a" | "alt_b" | "alt_c";
  label: string;
  provider: "edge" | "openai";
  model: string;
  voice: string;
  speed: number;
  description: string;
}

export const CANDIDATE_VOICE_ALTERNATIVES: Record<StudioVoiceLanguage, Record<"baseline" | "alt_a" | "alt_b" | "alt_c", VoiceCandidate>> = {
  en: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "en-IN-NeerjaExpressiveNeural",
      speed: 0.96,
      description: "Frozen Baseline: Indian English Expressive Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.92,
      description: "OpenAI Nova HD (Warm, conversational, natural micro-intonation)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.92,
      description: "OpenAI Shimmer HD (Soft, gentle therapeutic presence)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "edge",
      model: "edge-neural",
      voice: "en-US-AvaMultilingualNeural",
      speed: 0.94,
      description: "Edge Ava Multilingual Neural (Modern global conversational)",
    },
  },
  hi: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "hi-IN-SwaraNeural",
      speed: 0.96,
      description: "Frozen Baseline: Swara Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "edge",
      model: "edge-neural",
      voice: "hi-IN-MadhurNeural",
      speed: 0.95,
      description: "Edge Madhur Neural (Male counterpart, warm grounded cadence)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.90,
      description: "OpenAI Nova HD (Multilingual Hindi synthesis)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.90,
      description: "OpenAI Shimmer HD (Multilingual Hindi synthesis)",
    },
  },
  ta: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "ta-IN-PallaviNeural",
      speed: 0.95,
      description: "Frozen Baseline: Pallavi Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "edge",
      model: "edge-neural",
      voice: "ta-IN-ValluvarNeural",
      speed: 0.94,
      description: "Edge Valluvar Neural (Male counterpart, formal articulation)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.88,
      description: "OpenAI Nova HD (Multilingual Tamil synthesis test)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.88,
      description: "OpenAI Shimmer HD (Multilingual Tamil synthesis test)",
    },
  },
  te: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "te-IN-ShrutiNeural",
      speed: 0.95,
      description: "Frozen Baseline: Shruti Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "edge",
      model: "edge-neural",
      voice: "te-IN-MohanNeural",
      speed: 0.94,
      description: "Edge Mohan Neural (Male counterpart)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.90,
      description: "OpenAI Nova HD (Multilingual Telugu synthesis test)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.90,
      description: "OpenAI Shimmer HD (Multilingual Telugu synthesis test)",
    },
  },
  mr: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "mr-IN-AarohiNeural",
      speed: 0.95,
      description: "Frozen Baseline: Aarohi Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "edge",
      model: "edge-neural",
      voice: "mr-IN-ManoharNeural",
      speed: 0.94,
      description: "Edge Manohar Neural (Male counterpart)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.90,
      description: "OpenAI Nova HD (Multilingual Marathi synthesis test)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.90,
      description: "OpenAI Shimmer HD (Multilingual Marathi synthesis test)",
    },
  },
  gu: {
    baseline: {
      id: "baseline",
      label: "Current Athena Voice",
      provider: "edge",
      model: "edge-neural",
      voice: "gu-IN-DhwaniNeural",
      speed: 0.95,
      description: "Frozen Baseline: Dhwani Neural",
    },
    alt_a: {
      id: "alt_a",
      label: "Alternative Voice A",
      provider: "edge",
      model: "edge-neural",
      voice: "gu-IN-NiranjanNeural",
      speed: 0.94,
      description: "Edge Niranjan Neural (Male counterpart)",
    },
    alt_b: {
      id: "alt_b",
      label: "Alternative Voice B",
      provider: "openai",
      model: "tts-1-hd",
      voice: "nova",
      speed: 0.90,
      description: "OpenAI Nova HD (Multilingual Gujarati synthesis test)",
    },
    alt_c: {
      id: "alt_c",
      label: "Alternative Voice C",
      provider: "openai",
      model: "tts-1-hd",
      voice: "shimmer",
      speed: 0.90,
      description: "OpenAI Shimmer HD (Multilingual Gujarati synthesis test)",
    },
  },
};

// ============================================================================
// 3. NATIVE CALM EVALUATION SCRIPTS (AUTHENTIC NON-TRANSLATED)
// ============================================================================
export const NATIVE_EVALUATION_SCRIPTS: Record<StudioVoiceLanguage, string> = {
  en: `Take a slow breath in.

And when you're ready,
let it go gently.

You don't need to change anything right now.

Just stay here for a moment.`,

  hi: `एक गहरा, धीमा सांस अंदर लीजिए...

और जब आप तैयार हों,
तो इसे धीरे से बाहर छोड़ दीजिए।

इस समय आपको कुछ भी बदलने की ज़रूरत नहीं है।

बस थोड़ी देर यहीं बने रहिए।`,

  ta: `மெதுவா ஒரு ஆழ்ந்த மூச்சை உள்ளே இழுங்க...

உங்களுக்கு தோணும்போது,
அப்படியே மெதுவா வெளியே விடுங்க.

இப்போதைக்கு நீங்க எதையும் மாத்த தேவையில்லை.

கொஞ்ச நேரம் அமைதியா அப்படியே இருங்க.`,

  te: `ఒక్కసారి నెమ్మదిగా శ్వాస లోపలికి తీసుకోండి...

మీకు వీలైనప్పుడు,
శాంతంగా దాన్ని బయటకు వదిలేయండి.

ఈ సమయంలో మీరు ఏమీ మార్చాల్సిన పనిలేదు.

కాసేపు ప్రశాంతంగా ఇలాగే ఉండండి.`,

  mr: `हळूच एक संथ श्वास आत घ्या...

आणि जेव्हा तुमची तयारी असेल,
तेव्हा अलगदपणे तो बाहेर सोडा.

या क्षणी तुम्हाला काहीही बदलण्याची गरज नाही.

फक्त थोडा वेळ इथेच शांत राहा.`,

  gu: `ધીમેથી એક ઊંડો શ્વાસ અંદર લો...

અને જ્યારે તમે તૈયાર હો,
ત્યારે હળવેથી તેને બહાર નીકળવા દો.

અત્યારે તમારે કશુંય બદલવાની જરૂર નથી.

બસ થોડી ક્ષણ અહીં શાંતિથી રહો.`,
};

/**
 * Exercise Category Pace Modifiers
 * Configures speaking rate per exercise category so breathing is slow and focus is crisp.
 */
export const CATEGORY_PACE_MODIFIERS: Record<string, number> = {
  BREATHE: 0.94,     // Natural unhurried breathing pace with intentional pauses
  RELAXATION: 0.93,  // Warm, gentle cadence without vocoder dragging
  UNWIND: 0.95,      // Relaxed conversational evening flow
  RESET: 0.96,       // Natural, present, comforting human cadence
  GROUND: 0.95,      // Steady, grounded observation
  FOCUS: 0.98,       // Clear, attentive, natural tempo
};

/**
 * Communicative Intent Cadence Offsets
 * Human speech speed varies naturally according to communicative purpose (V4 Natural Prosody):
 * - inviting: welcoming, gentle, slight pause (-0.02)
 * - release: lighter, letting go, smooth (+0.02)
 * - reassurance: conversational, comforting, steady (0.00)
 * - settling: grounded, quiet, unhurried (-0.01)
 * - alert: focused, clear, crisp (+0.03)
 */
export type CommunicativeIntent = "inviting" | "release" | "reassurance" | "settling" | "alert";

export const COMMUNICATIVE_INTENT_OFFSETS: Record<CommunicativeIntent, number> = {
  inviting: -0.02,
  release: +0.02,
  reassurance: 0.00,
  settling: -0.01,
  alert: +0.03,
};

/**
 * Prepares text for speech generation:
 * - Keeps UI display text clean while applying phonetic hints only where necessary
 * - Strips any accidental introductory welcome spam
 * - Strips parenthetical timing prompts (e.g., "(4s)", "(5s)") so they aren't spoken as robotic countdowns
 * - Enforces meditative pauses with open prosody without Romanizing native text
 */
export function prepareTextForSpeech(
  displayText: string,
  language: StudioVoiceLanguage,
  context?: { category?: string; stepOrder?: number }
): string {
  if (!displayText) return "";

  const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
  let speechText = displayText;

  // Never speak "Athena" repeatedly. If the brand name appears in text, apply phonetic pronunciation
  for (const [word, phonetic] of Object.entries(profile.pronunciationMap)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    speechText = speechText.replace(regex, phonetic);
  }

  // Remove any residual generic welcome prefix
  speechText = speechText
    .replace(/^Welcome to Athena[.,!\s]*/i, "")
    .replace(/^Welcome to your Athena sanctuary[.,!\s]*/i, "")
    .replace(/^Hello, I'm Athena[.,!\s]*/i, "")
    .replace(/^अथेना में आपका स्वागत है[।.,!\s]*/i, "")
    .replace(/^அத்தீனாவிற்கு நல்வரவு[।.,!\s]*/i, "")
    .replace(/^అథీనాకు స్వాగతం[।.,!\s]*/i, "")
    .replace(/^अथेनामध्ये आपले स्वागत आहे[।.,!\s]*/i, "")
    .replace(/^અથેનામાં આપનું સ્વાગત છે[।.,!\s]*/i, "");

  // Strip parenthetical timing prompts from spoken narration (e.g. "(4s)", "(16s)")
  // Human instructors never speak seconds countdowns aloud.
  speechText = speechText.replace(/\s*\(\d+s\)/gi, "");

  // Clean meditative pauses (ellipses and commas for open intonation)
  speechText = speechText
    .replace(/\.{3,}/g, "... ")
    .replace(/,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Micro-Prosody: Convert continuation words after ellipses to lowercase so TTS
  // maintains open thought-group intonation rather than triggering a terminal pitch reset
  speechText = speechText.replace(/\.\.\.\s+([A-Z])/g, (match, letter) => {
    return `... ${letter.toLowerCase()}`;
  });

  return speechText;
}

/**
 * Parses a step's speech text into structured SpeechSegments with calibrated silences
 */
export function parseScriptIntoSegments(
  voiceText: string,
  totalDurationSeconds?: number
): SpeechSegment[] {
  if (!voiceText || !voiceText.trim()) return [];

  // Split on sentence terminators or ellipsis pauses
  const parts = voiceText
    .split(/(?<=[.!?।])\s+|\s*\.\.\.\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return [];

  return parts.map((part, idx) => {
    const isLast = idx === parts.length - 1;
    const pauseAfter = isLast ? 3500 : 2000;
    return {
      text: part,
      pauseBeforeMs: idx === 0 ? 300 : 600,
      pauseAfterMs: pauseAfter,
      emphasis: "gentle",
    };
  });
}
