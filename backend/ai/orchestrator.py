import json
from datetime import datetime
from typing import Optional, Dict, Any
from ai.reasoning import reason, contains_explicit_crisis, is_casual_or_safe, classify_safety
from ai.prompts import detect_script_language
from ai.context_builder import assemble_ai_context
from ai.therapist import generate, generate_stream
from ai.memory_manager import (
    get_user_memory,
    update_user_memory,
    clear_user_memory,
    get_memory_summary
)
from services.chat_service import load_history, save_message
from services.profile_service import get_profile

from ai.safety import evaluate_message_safety, CRISIS_RESPONSES, AMBIGUOUS_SAFETY_CLARIFICATIONS, CRISIS_RESPONSE_TEXT

# In-memory session store: session_id -> list of message dicts
sessions: Dict[str, list] = {}
# Session ownership mapping: session_id -> user_id
session_owners: Dict[str, str] = {}

def get_session_history(session_id: str, user_id: Optional[str] = None):
    # Enforce isolation: if session belongs to someone else, do not return it
    if user_id and session_id in session_owners and session_owners[session_id] != user_id:
        return []

    # If in-memory is empty and session_id is a UUID, attempt to load from Supabase
    if session_id not in sessions or not sessions[session_id]:
        if len(session_id) >= 32 and "-" in session_id:
            try:
                db_msgs = load_history(session_id)
                if db_msgs:
                    sessions[session_id] = [
                        {
                            "role": m.get("role", "user"),
                            "content": m.get("content", ""),
                            "timestamp": m.get("created_at", datetime.utcnow().isoformat())
                        }
                        for m in db_msgs
                    ]
                    if user_id:
                        session_owners[session_id] = user_id
            except Exception as e:
                print(f"[History Load Error] {e}")

    return sessions.get(session_id, [])

def clear_session(session_id: str, user_id: Optional[str] = None):
    if user_id and session_id in session_owners and session_owners[session_id] != user_id:
        return {"status": "unauthorized", "session_id": session_id}
    if session_id in sessions:
        sessions[session_id] = []
    return {"status": "cleared", "session_id": session_id}

def list_active_sessions(user_id: Optional[str] = None):
    results = []
    for sid, msgs in sessions.items():
        if user_id and session_owners.get(sid) != user_id:
            continue
        results.append({
            "session_id": sid,
            "message_count": len(msgs),
            "last_active": msgs[-1].get("timestamp") if msgs else None
        })
    return results

def chat(
    session_id: str,
    message: str,
    user_id: Optional[str] = None,
    internal_context: Optional[str] = None,
    conversation_language: Optional[str] = None
) -> dict:
    session_id = session_id or "default-session"
    if user_id:
        session_owners[session_id] = user_id

    memory_key = user_id if user_id else session_id
    active_lang = conversation_language or detect_script_language(message) or "en"

    # Restore history if needed
    if session_id not in sessions:
        sessions[session_id] = get_session_history(session_id, user_id)

    history = sessions[session_id]

    user_profile = get_profile(user_id) if user_id else None

    # Layer 0: Contextual Safety Check (Self-harm classification, Ambiguous Hopelessness, Prompt Extraction)
    is_safety, action_type, safety_reply = evaluate_message_safety(message, user_profile=user_profile, language=active_lang)
    if is_safety and safety_reply:
        history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        history.append({
            "role": "assistant",
            "content": safety_reply,
            "timestamp": datetime.utcnow().isoformat()
        })
        sessions[session_id] = history[-30:]

        if user_id and session_id:
            try:
                save_message(session_id, "user", message)
                save_message(session_id, "assistant", safety_reply)
            except Exception:
                pass

        if action_type == "CRISIS":
            meta = {
                "risk": "crisis",
                "safety_level": "high",
                "safety_category": action_type,
                "detected_at": datetime.utcnow().isoformat(),
                "resource_panel_shown": True,
                "crisis_resources": {
                    "national_emergency": "112",
                    "tele_manas": "14416",
                    "tele_manas_toll_free": "1800-89-14416"
                },
                "emotion": "overwhelmed",
                "stage": "crisis_support",
                "thinking_pattern": "none",
                "therapy_approach": "immediate safety guidance",
                "suggested_replies": [
                    "I am safe right now",
                    "I am reaching out to Tele-MANAS (14416)",
                    "Can you guide me through slow breathing?"
                ]
            }
        elif action_type == "AMBIGUOUS_SAFETY_CLARIFICATION":
            meta = {
                "risk": "moderate",
                "safety_level": "elevated",
                "safety_category": action_type,
                "detected_at": datetime.utcnow().isoformat(),
                "resource_panel_shown": False,
                "emotion": "hopelessness",
                "stage": "safety_clarification",
                "thinking_pattern": "none",
                "therapy_approach": "direct gentle safety check",
                "suggested_replies": [
                    "I am safe, just feeling overwhelmed",
                    "I'm having dark thoughts",
                    "Could we do a grounding exercise?"
                ]
            }
        else:
            meta = {
                "risk": "low",
                "safety_level": "normal",
                "safety_category": action_type,
                "primary_emotion": "boundary_setting",
                "conversation_stage": "boundary_setting",
                "therapy_approach": "compassionate boundaries"
            }

        return {
            "reply": safety_reply,
            "session_id": session_id,
            "metadata": meta
        }

    # Check if prior assistant turn was already a crisis response
    prev_assistant_msg = next((m for m in reversed(history) if m.get("role") == "assistant"), None)
    prev_was_crisis = bool(
        prev_assistant_msg and ("112" in prev_assistant_msg.get("content", "") or "14416" in prev_assistant_msg.get("content", "") or "Tele-MANAS" in prev_assistant_msg.get("content", ""))
    )

    # Retrieve living user memory
    user_memory = get_user_memory(memory_key)

    # Perform mental wellness reasoning & cognitive analysis with baseline profile
    reasoning = reason(message, history, user_memory=user_memory, user_profile=user_profile)
    risk_level = reasoning.get("risk", "none")

    # If coming from Panic Reset or internal context provided, enforce gentle unhurried grounding
    if internal_context:
        reasoning["internal_context"] = internal_context
        reasoning["therapy_approach"] = "gentle grounding, unhurried warmth, slow pacing, no unsolicited problem solving"
        reasoning["primary_emotion"] = "overwhelmed"
        reasoning["conversation_stage"] = "grounding_presence"

    # De-escalation guardrail:
    if prev_was_crisis and not contains_explicit_crisis(message):
        risk_level = "low" if is_casual_or_safe(message) else "moderate"
        reasoning["risk"] = risk_level
        reasoning["conversation_stage"] = "somatic_grounding"
        reasoning["therapy_approach"] = "gentle relief, grounding presence, and open acceptance"

    # Handle immediate crisis safety protocol (strictly on active crisis statements)
    if risk_level == "crisis" and contains_explicit_crisis(message):
        safety_cat = classify_safety(message)
        crisis_reply = CRISIS_RESPONSES.get(active_lang, CRISIS_RESPONSES["en"])

        history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        history.append({
            "role": "assistant",
            "content": crisis_reply,
            "timestamp": datetime.utcnow().isoformat()
        })
        sessions[session_id] = history[-30:]

        # If logged in and valid conversation, persist to Supabase / local
        if user_id and session_id:
            try:
                save_message(session_id, "user", message)
                save_message(session_id, "assistant", crisis_reply)
            except Exception as e:
                print(f"[Supabase Save Message Error] {e}")

        return {
            "reply": crisis_reply,
            "session_id": session_id,
            "metadata": {
                "risk": "crisis",
                "safety_level": "high",
                "safety_category": safety_cat,
                "detected_at": datetime.utcnow().isoformat(),
                "resource_panel_shown": True,
                "crisis_resources": {
                    "national_emergency": "112",
                    "tele_manas": "14416",
                    "tele_manas_toll_free": "1800-89-14416"
                },
                "emotion": "overwhelmed",
                "stage": "crisis_support",
                "thinking_pattern": "none",
                "suggested_replies": [
                    "I am safe right now",
                    "I am reaching out to Tele-MANAS (14416)",
                    "Can you guide me through slow breathing?"
                ]
            },
            "memory": get_memory_summary(memory_key)
        }

    # Assemble Tiered AI Context
    ai_context = assemble_ai_context(
        session_id=session_id,
        message=message,
        history=history,
        user_memory=user_memory,
        user_profile=user_profile,
        user_id=user_id,
        internal_context=internal_context
    )

    # Generate empathetic therapist response with living memory, user baseline
    reply = generate(
        message,
        ai_context.get("recent_messages", history),
        reasoning,
        user_memory=user_memory,
        user_profile=user_profile,
        internal_context=internal_context,
        conversation_language=active_lang
    )

    # Update history in memory
    history.append({
        "role": "user",
        "content": message,
        "timestamp": datetime.utcnow().isoformat()
    })
    history.append({
        "role": "assistant",
        "content": reply,
        "timestamp": datetime.utcnow().isoformat()
    })
    sessions[session_id] = history[-30:]

    # Update user memory profile with new insights from this turn
    updated_memory = update_user_memory(
        identifier=memory_key,
        new_insights=reasoning.get("new_insights", {}),
        user_message=message,
        emotion=reasoning.get("primary_emotion", "reflective"),
        stage=reasoning.get("conversation_stage", "exploration"),
        user_id=user_id
    )

    # If logged in and valid conversation, persist messages to Supabase / local
    if user_id and session_id:
        try:
            save_message(session_id, "user", message)
            save_message(session_id, "assistant", reply)
        except Exception as e:
            print(f"[Supabase Save Message Error] {e}")

    memory_summary = get_memory_summary(memory_key)

    return {
        "reply": reply,
        "session_id": session_id,
        "metadata": {
            "risk": risk_level,
            "emotion": reasoning.get("primary_emotion", "reflective"),
            "secondary_emotion": reasoning.get("secondary_emotion"),
            "intensity": reasoning.get("intensity", "moderate"),
            "stage": reasoning.get("conversation_stage", "exploration"),
            "thinking_pattern": reasoning.get("thinking_pattern", "none"),
            "focus": reasoning.get("current_focus", "wellness"),
            "therapy_approach": reasoning.get("therapy_approach", "holding space"),
            "suggested_replies": reasoning.get("suggested_replies", [
                "Tell me more about how I can handle this",
                "Could we do a quick grounding exercise together?",
                "How can I stop overthinking this?"
            ])
        },
        "memory": memory_summary
    }

def chat_stream(
    session_id: str,
    message: str,
    user_id: Optional[str] = None,
    internal_context: Optional[str] = None,
    conversation_language: Optional[str] = None
):
    session_id = session_id or "default-session"
    if user_id:
        session_owners[session_id] = user_id

    memory_key = user_id if user_id else session_id
    active_lang = conversation_language or detect_script_language(message) or "en"

    if session_id not in sessions:
        sessions[session_id] = get_session_history(session_id, user_id)

    history = sessions[session_id]

    user_profile = get_profile(user_id) if user_id else None

    # Layer 0: Contextual Safety Check (Deterministic fast triage)
    is_safety, action_type, safety_reply = evaluate_message_safety(message, user_profile=user_profile, language=active_lang)
    if is_safety and safety_reply:
        history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        history.append({
            "role": "assistant",
            "content": safety_reply,
            "timestamp": datetime.utcnow().isoformat()
        })
        sessions[session_id] = history[-30:]
        if user_id and session_id:
            try:
                save_message(session_id, "user", message)
                save_message(session_id, "assistant", safety_reply)
            except Exception:
                pass

        if action_type == "CRISIS":
            meta = {
                "risk": "crisis",
                "safety_level": "high",
                "safety_category": action_type,
                "detected_at": datetime.utcnow().isoformat(),
                "resource_panel_shown": True,
                "crisis_resources": {
                    "national_emergency": "112",
                    "tele_manas": "14416",
                    "tele_manas_toll_free": "1800-89-14416"
                },
                "emotion": "overwhelmed",
                "stage": "crisis_support",
                "thinking_pattern": "none",
                "therapy_approach": "immediate safety guidance",
                "suggested_replies": [
                    "I am safe right now",
                    "I am reaching out to Tele-MANAS (14416)",
                    "Can you guide me through slow breathing?"
                ]
            }
        elif action_type == "AMBIGUOUS_SAFETY_CLARIFICATION":
            meta = {
                "risk": "moderate",
                "safety_level": "elevated",
                "safety_category": action_type,
                "detected_at": datetime.utcnow().isoformat(),
                "resource_panel_shown": False,
                "emotion": "hopelessness",
                "stage": "safety_clarification",
                "thinking_pattern": "none",
                "therapy_approach": "direct gentle safety check",
                "suggested_replies": [
                    "I am safe, just feeling overwhelmed",
                    "I'm having dark thoughts",
                    "Could we do a grounding exercise?"
                ]
            }
        else:
            meta = {
                "risk": "low",
                "safety_level": "normal",
                "safety_category": action_type,
                "primary_emotion": "boundary_setting",
                "conversation_stage": "boundary_setting",
                "therapy_approach": "compassionate boundaries"
            }

        yield f"event: start\ndata: {json.dumps({'session_id': session_id, 'metadata': meta})}\n\n"
        yield f"event: token\ndata: {json.dumps({'content': safety_reply})}\n\n"
        yield f"event: done\ndata: {json.dumps({'reply': safety_reply, 'session_id': session_id, 'metadata': meta, 'memory': get_memory_summary(memory_key)})}\n\n"
        return

    prev_assistant_msg = next((m for m in reversed(history) if m.get("role") == "assistant"), None)
    prev_was_crisis = bool(
        prev_assistant_msg and ("112" in prev_assistant_msg.get("content", "") or "14416" in prev_assistant_msg.get("content", "") or "Tele-MANAS" in prev_assistant_msg.get("content", ""))
    )

    user_memory = get_user_memory(memory_key)

    reasoning = reason(message, history, user_memory=user_memory, user_profile=user_profile)
    risk_level = reasoning.get("risk", "none")

    # If coming from Panic Reset or internal context provided, enforce gentle unhurried grounding
    if internal_context:
        reasoning["internal_context"] = internal_context
        reasoning["therapy_approach"] = "gentle grounding, unhurried warmth, slow pacing, no unsolicited problem solving"
        reasoning["primary_emotion"] = "overwhelmed"
        reasoning["conversation_stage"] = "grounding_presence"

    if prev_was_crisis and not contains_explicit_crisis(message):
        risk_level = "low" if is_casual_or_safe(message) else "moderate"
        reasoning["risk"] = risk_level
        reasoning["conversation_stage"] = "somatic_grounding"
        reasoning["therapy_approach"] = "gentle relief, grounding presence, and open acceptance"

    # Handle immediate crisis safety protocol
    if risk_level == "crisis" and contains_explicit_crisis(message):
        safety_cat = classify_safety(message)
        crisis_reply = CRISIS_RESPONSES.get(active_lang, CRISIS_RESPONSES["en"])

        history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        history.append({
            "role": "assistant",
            "content": crisis_reply,
            "timestamp": datetime.utcnow().isoformat()
        })
        sessions[session_id] = history[-30:]

        if user_id and session_id:
            try:
                save_message(session_id, "user", message)
                save_message(session_id, "assistant", crisis_reply)
            except Exception as e:
                print(f"[Supabase Save Message Error] {e}")

        meta = {
            "risk": "crisis",
            "safety_level": "high",
            "safety_category": safety_cat,
            "detected_at": datetime.utcnow().isoformat(),
            "resource_panel_shown": True,
            "crisis_resources": {
                "national_emergency": "112",
                "tele_manas": "14416",
                "tele_manas_toll_free": "1800-89-14416"
            },
            "emotion": "overwhelmed",
            "stage": "crisis_support",
            "thinking_pattern": "none",
            "suggested_replies": [
                "I am safe right now",
                "I am calling Tele-MANAS (14416)",
                "Can you guide me through slow breathing?"
            ]
        }
        yield f"event: start\ndata: {json.dumps({'session_id': session_id, 'metadata': meta})}\n\n"
        yield f"event: token\ndata: {json.dumps({'content': crisis_reply})}\n\n"
        yield f"event: done\ndata: {json.dumps({'reply': crisis_reply, 'session_id': session_id, 'metadata': meta, 'memory': get_memory_summary(memory_key)})}\n\n"
        return

    # Assemble Tiered AI Context
    ai_context = assemble_ai_context(
        session_id=session_id,
        message=message,
        history=history,
        user_memory=user_memory,
        user_profile=user_profile,
        user_id=user_id,
        internal_context=internal_context
    )

    suggested_replies_list = reasoning.get("suggested_replies", [
        "Tell me more about how I can handle this",
        "Could we do a quick grounding exercise together?",
        "How can I stop overthinking this?"
    ])

    meta = {
        "risk": risk_level,
        "emotion": reasoning.get("primary_emotion", "reflective"),
        "secondary_emotion": reasoning.get("secondary_emotion"),
        "intensity": reasoning.get("intensity", "moderate"),
        "stage": reasoning.get("conversation_stage", "exploration"),
        "thinking_pattern": reasoning.get("thinking_pattern", "none"),
        "focus": reasoning.get("current_focus", "wellness"),
        "therapy_approach": reasoning.get("therapy_approach", "holding space"),
        "suggested_replies": suggested_replies_list
    }

    yield f"event: start\ndata: {json.dumps({'session_id': session_id, 'metadata': meta})}\n\n"

    accumulated = ""
    saved_to_db = False
    try:
        for chunk in generate_stream(
            message,
            ai_context.get("recent_messages", history),
            reasoning,
            user_memory=user_memory,
            user_profile=user_profile,
            internal_context=internal_context,
            conversation_language=active_lang
        ):
            accumulated += chunk
            yield f"event: token\ndata: {json.dumps({'content': chunk})}\n\n"
    finally:
        trimmed_accumulated = accumulated.strip()
        if trimmed_accumulated and not saved_to_db:
            saved_to_db = True
            history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            })
            history.append({
                "role": "assistant",
                "content": trimmed_accumulated,
                "timestamp": datetime.utcnow().isoformat()
            })
            sessions[session_id] = history[-30:]

            try:
                update_user_memory(
                    identifier=memory_key,
                    new_insights=reasoning.get("new_insights", {}),
                    user_message=message,
                    emotion=reasoning.get("primary_emotion", "reflective"),
                    stage=reasoning.get("conversation_stage", "exploration"),
                    user_id=user_id
                )
            except Exception as e:
                print(f"[Update Memory Error] {e}")

            if user_id and session_id:
                try:
                    save_message(session_id, "user", message)
                    save_message(session_id, "assistant", trimmed_accumulated)
                except Exception as e:
                    print(f"[Supabase Save Message Error] {e}")

        mem_summary = get_memory_summary(memory_key)
        yield f"event: done\ndata: {json.dumps({'reply': trimmed_accumulated, 'session_id': session_id, 'metadata': meta, 'memory': mem_summary})}\n\n"

