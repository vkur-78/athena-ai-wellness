"""Guided Session Service.
Script library and cue generator for all 9 Athena Studio practices:
- breathe (Breathe Together)
- ground (Ground Me 5-4-3-2-1)
- yoga (Yoga Sanctuary - Yoga Instructor Mode)
- body_scan (Body Scan Relaxation)
- walk (Mindful Walk)
- pmr (Progressive Muscle Relaxation)
- self_compassion (Self-Compassion Practice)
- quiet (Quiet Pause)
- sleep (Sleep Sanctuary)

Supports Quick (1-3 min), Guided (5-10 min), and Quiet (opening/ending) modes,
with adaptive tone modulation (Gentle Encouragement vs Practical Guidance).
"""
from typing import List, Dict, Any, Optional
from models.guided_session import VoiceCue, GuidedSessionScript


def _build_cue(
    cue_id: str,
    text: str,
    phase: str = "guidance",
    duration: float = 3.5,
    pause_after: float = 2.0,
    visual_cue: Optional[str] = None,
    region: Optional[str] = None,
    subtitle: Optional[str] = None,
    tone: Optional[str] = "gentle",
) -> VoiceCue:
    return VoiceCue(
        id=cue_id,
        text=text,
        phase=phase,
        duration_seconds=duration,
        pause_after_seconds=pause_after,
        visual_cue=visual_cue,
        region_highlight=region,
        subtitle=subtitle or text,
        tone_variant=tone,
    )


# ==============================================================================
# 1. BREATHING PRACTICE (breathe)
# ==============================================================================
def get_breathing_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(
            _build_cue(
                "br_q_open",
                "Arrive gently in this breath. There is nothing else you need to do." if is_gentle
                else "Begin by settling into your natural breathing rhythm.",
                phase="opening",
                duration=3.5,
                pause_after=4.0,
                visual_cue="expand",
            )
        )
        cues.append(
            _build_cue(
                "br_q_close",
                "Whenever you feel ready, carry this steady softness forward." if is_gentle
                else "Session concluding. Maintain this calm physiological baseline.",
                phase="closing",
                duration=3.5,
                pause_after=1.0,
                visual_cue="contract",
            )
        )
        est_duration = 120
    elif mode == "quick":
        # 1-2 min quick coherence
        cues.append(
            _build_cue(
                "br_quick_open",
                "Let's take a quick moment to settle your nervous system together." if is_gentle
                else "Initiating coherent 4-4-4 breathing cycle to lower autonomic arousal.",
                phase="opening",
                duration=3.5,
                pause_after=2.0,
                visual_cue="expand",
            )
        )
        # 4 breathing rounds
        for r in range(1, 5):
            cues.append(_build_cue(f"br_quick_in_{r}", "Breathe in softly...", phase="inhale", duration=2.5, pause_after=1.5, visual_cue="expand"))
            cues.append(_build_cue(f"br_quick_hold_{r}", "Hold gently here...", phase="hold", duration=2.0, pause_after=2.0, visual_cue="hold"))
            cues.append(_build_cue(f"br_quick_ex_{r}", "Release and let go...", phase="exhale", duration=2.5, pause_after=1.5, visual_cue="contract"))
            cues.append(_build_cue(f"br_quick_rest_{r}", "Soft stillness.", phase="rest", duration=1.5, pause_after=1.5, visual_cue="still"))

        cues.append(
            _build_cue(
                "br_quick_close",
                "Thank you for pausing. You are centered and ready." if is_gentle
                else "Cycle complete. Autonomic tone stabilized.",
                phase="closing",
                duration=3.0,
                pause_after=1.0,
                visual_cue="still",
            )
        )
        est_duration = 100
    else:
        # Full Guided mode (5 min)
        cues.append(
            _build_cue(
                "br_g_open",
                "Welcome. There is nothing to get right here. Simply let your breathing align with ease." if is_gentle
                else "Begin posture alignment: relax the shoulders and breathe from the lower diaphragm.",
                phase="opening",
                duration=4.5,
                pause_after=3.0,
                visual_cue="expand",
            )
        )
        # Rounds with alternating somatic cues
        somatic_prompts_gentle = [
            "Notice if your shoulders drop away from your ears as you breathe out.",
            "Let the muscles around your eyes and temples soften.",
            "Allow your chest and belly to expand naturally, without forcing.",
            "You are right here, held safely in this moment.",
            "Feel the subtle wave of calm spreading with each breath.",
        ]
        somatic_prompts_practical = [
            "Engage diaphragmatic expansion on the inhale, engaging vagal tone.",
            "Allow smooth lung deflation on the exhale, reducing heart rate.",
            "Maintain an unforced 4-second cadence to balance carbon dioxide levels.",
            "Notice the physical downshift in your nervous system.",
            "Sustain smooth transitions between inhale and exhale.",
        ]
        prompts = somatic_prompts_gentle if is_gentle else somatic_prompts_practical

        for r in range(1, 6):
            cues.append(_build_cue(f"br_g_in_{r}", "Inhale softly and deeply...", phase="inhale", duration=2.5, pause_after=1.5, visual_cue="expand"))
            cues.append(_build_cue(f"br_g_hold_{r}", "Holding with gentle ease...", phase="hold", duration=2.0, pause_after=2.0, visual_cue="hold"))
            cues.append(_build_cue(f"br_g_ex_{r}", "Long, slow exhale releasing tension...", phase="exhale", duration=2.8, pause_after=1.2, visual_cue="contract"))
            cues.append(_build_cue(f"br_g_soma_{r}", prompts[r - 1], phase="somatic_check", duration=3.8, pause_after=2.5, visual_cue="still"))

        cues.append(
            _build_cue(
                "br_g_close",
                "Take a moment to thank yourself for making this space today." if is_gentle
                else "Guided breathing complete. Nervous system regulated.",
                phase="closing",
                duration=3.5,
                pause_after=1.0,
                visual_cue="still",
            )
        )
        est_duration = 300

    return GuidedSessionScript(
        practice_type="breathe",
        title="Breathe Together Coaching",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
        metadata={"cycle_type": "box_444"},
    )


# ==============================================================================
# 2. GROUNDING PRACTICE (ground - 5-4-3-2-1)
# ==============================================================================
def get_grounding_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("gr_q_open", "Feel the ground beneath you. Settle into the room.", phase="opening", duration=3.5, pause_after=8.0))
        cues.append(_build_cue("gr_q_close", "You are grounded, safe, and right here.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 90
    elif mode == "quick":
        cues.append(_build_cue("gr_qk_open", "Let's quickly reconnect your senses to the space around you.", phase="opening", duration=3.5, pause_after=2.0))
        cues.append(_build_cue("gr_qk_5", "Look around and notice 5 things you can see.", phase="sight", duration=3.0, pause_after=8.0, visual_cue="sight"))
        cues.append(_build_cue("gr_qk_4", "Notice 4 things you can physically feel against your skin.", phase="touch", duration=3.5, pause_after=8.0, visual_cue="touch"))
        cues.append(_build_cue("gr_qk_3", "Listen for 3 sounds reaching your ears.", phase="sound", duration=3.0, pause_after=8.0, visual_cue="sound"))
        cues.append(_build_cue("gr_qk_2", "Notice 2 scents in the air.", phase="smell", duration=2.5, pause_after=6.0, visual_cue="smell"))
        cues.append(_build_cue("gr_qk_1", "Notice 1 taste or sensation in your mouth.", phase="taste", duration=2.5, pause_after=5.0, visual_cue="taste"))
        cues.append(_build_cue("gr_qk_close", "You are anchored back in the present moment.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 150
    else:
        # Full unhurried 5-4-3-2-1 with deep clinical observation pauses
        cues.append(
            _build_cue(
                "gr_g_open",
                "Take a comfortable breath. Wherever your mind has been drifting, we are bringing you gently back into this room, right now." if is_gentle
                else "Begin 5-4-3-2-1 sensory orientation to interrupt cognitive spinning and ground into the immediate physical environment.",
                phase="opening",
                duration=5.0,
                pause_after=4.0,
            )
        )
        cues.append(
            _build_cue(
                "gr_g_5",
                "First, look softly around you. Name five things you can see. Look for textures, the light touching a surface, or shadows on the wall." if is_gentle
                else "Identify 5 distinct visual objects. Note color, boundaries, and spatial orientation.",
                phase="sight",
                duration=6.0,
                pause_after=14.0,
                visual_cue="sight",
            )
        )
        cues.append(
            _build_cue(
                "gr_g_4",
                "Now, shift awareness into physical touch. Notice four things you can feel. The ground under your feet, fabric resting against your skin, or the temperature of your hands." if is_gentle
                else "Identify 4 tactile inputs: feet contact, chair support, fabric texture, or ambient air temperature.",
                phase="touch",
                duration=6.5,
                pause_after=14.0,
                visual_cue="touch",
            )
        )
        cues.append(
            _build_cue(
                "gr_g_3",
                "Now close your eyes if comfortable, and listen for three sounds. First the most prominent sound, and then two softer, quieter sounds underneath." if is_gentle
                else "Track 3 auditory signals. Differentiate between near-field sounds and distant background ambient frequencies.",
                phase="sound",
                duration=6.5,
                pause_after=14.0,
                visual_cue="sound",
            )
        )
        cues.append(
            _build_cue(
                "gr_g_2",
                "Breathe in gently and notice two scents. Perhaps fresh air, clothing, tea, or simply the clean neutrality of the space." if is_gentle
                else "Sample 2 olfactory cues through gentle nasal inhalation.",
                phase="smell",
                duration=5.5,
                pause_after=10.0,
                visual_cue="smell",
            )
        )
        cues.append(
            _build_cue(
                "gr_g_1",
                "Finally, notice one taste. Savor the feeling of your tongue resting softly on the floor of your mouth, or take a sip of cool water if nearby." if is_gentle
                else "Register 1 gustatory sensation or the neutral taste on the palate.",
                phase="taste",
                duration=5.5,
                pause_after=8.0,
                visual_cue="taste",
            )
        )
        cues.append(
            _build_cue(
                "gr_g_close",
                "Feel both feet steady on the floor. You are right here, safe and anchored in your body." if is_gentle
                else "Sensory reorientation complete. Nervous system grounded in current spacetime.",
                phase="closing",
                duration=4.5,
                pause_after=1.0,
            )
        )
        est_duration = 300

    return GuidedSessionScript(
        practice_type="ground",
        title="5-4-3-2-1 Sensory Grounding",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 3. YOGA SANCTUARY (yoga - Yoga Instructor Mode)
# ==============================================================================
def get_yoga_script(
    routine_id: Optional[str] = "desk_relief",
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    routine = (routine_id or "desk_relief").lower()
    cues: List[VoiceCue] = []

    # Flagship Yoga Instructor Mode
    if "morning" in routine:
        title = "Morning Reset Yoga Flow"
        pose_data = [
            (
                "Centering Mountain",
                "Stand tall or sit upright. Feel the soles of your feet rooting down into the earth as the crown of your head lifts softly.",
                "Notice if your jaw softened. Let your arms hang with natural ease.",
                "centering",
            ),
            (
                "Gentle Side Stretch",
                "Reach your right arm up and over toward the left, breathing length into your right ribcage.",
                "Notice the space created between each rib with every inhale.",
                "eagle_arms",
            ),
            (
                "Chest Opener",
                "Gently interlace your fingers behind your back or open your arms wide like wings.",
                "Allow your heart space to broaden without arching your lower back.",
                "heart_opener",
            ),
            (
                "Forward Soft Fold",
                "Softly hinge at your hips, bending your knees generously and letting your head hang heavy.",
                "Notice gravity gently releasing tension from your spine and neck.",
                "forward_fold",
            ),
        ]
    elif "anxiety" in routine:
        title = "Anxiety Release Restorative Yoga"
        pose_data = [
            (
                "Child's Pose",
                "Sink your hips back toward your heels and rest your forehead gently on the mat or cushion.",
                "Feel your belly expand against your thighs as you exhale and surrender weight.",
                "childs_pose",
            ),
            (
                "Gentle Cat-Cow",
                "On all fours, inhale as your heart moves forward, exhale as your spine rounds softly toward the ceiling.",
                "Move with your own natural cadence. Let there be zero rush between shapes.",
                "cat_cow",
            ),
            (
                "Supported Savasana",
                "Lie back comfortably, letting your arms fall out to the sides with palms facing up.",
                "Let the ground support the entirety of your body. You are held.",
                "savasana",
            ),
        ]
    else:  # desk_relief / default
        title = "Desk Relief Seated Yoga"
        pose_data = [
            (
                "Seated Centering",
                "Place both feet flat on the floor. Rest your hands softly in your lap and let your shoulders drop away from your ears.",
                "Notice if your neck feels a little lighter. Inhale softly through the nose.",
                "centering",
            ),
            (
                "Gentle Neck Rolls",
                "Tilt your right ear toward your right shoulder. Slowly roll your chin forward to your chest, then to the left.",
                "Notice if any tightness along the neck is ready to soften and let go.",
                "neck_roll",
            ),
            (
                "Seated Cat-Cow",
                "Rest hands on your knees. Inhale as you gently open your chest forward, exhale as you round your spine.",
                "Feel each vertebra moving with fluid, gentle freedom.",
                "cat_cow",
            ),
            (
                "Eagle Arms Stretch",
                "Cross your arms at the elbows, hugging your shoulders or pressing forearms together. Softly lift your elbows.",
                "Notice the gentle opening across the space between your shoulder blades.",
                "eagle_arms",
            ),
            (
                "Seated Spinal Twist",
                "Sit tall on an inhale, and exhale softly as you turn to the right, looking gently over your shoulder.",
                "Let the twist come from the mid-back rather than forcing your neck.",
                "spinal_twist",
            ),
        ]

    # Mode adaptation
    if mode == "quiet":
        cues.append(_build_cue("yo_q_open", "Begin in a comfortable posture. Listen to the rhythm of your body.", phase="opening", duration=3.5, pause_after=8.0))
        for idx, (p_name, _, _, sil) in enumerate(pose_data):
            cues.append(_build_cue(f"yo_q_p_{idx}", f"Moving into {p_name}.", phase="pose", duration=2.5, pause_after=25.0, visual_cue=sil))
        cues.append(_build_cue("yo_q_close", "Rest here. Notice the newfound lightness.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = len(pose_data) * 30
    elif mode == "quick":
        # First 3 poses with concise coaching
        cues.append(_build_cue("yo_qk_open", "Let's move through a brief, restorative sequence for your body.", phase="opening", duration=3.5, pause_after=3.0))
        for idx, (p_name, intro, check, sil) in enumerate(pose_data[:3]):
            cues.append(_build_cue(f"yo_qk_in_{idx}", f"Let's move into {p_name}. {intro}", phase="pose", duration=5.0, pause_after=10.0, visual_cue=sil))
            cues.append(_build_cue(f"yo_qk_ck_{idx}", check, phase="somatic_check", duration=4.0, pause_after=8.0, visual_cue=sil))
        cues.append(_build_cue("yo_qk_close", "Gently release. Notice how your body feels more at ease.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 140
    else:
        # Full Guided Yoga Instructor Mode
        cues.append(
            _build_cue(
                "yo_g_open",
                "Welcome to Yoga Sanctuary. I will be guiding you through each movement. Remember there is nothing to force. Move only as far as feels supportive." if is_gentle
                else "Initiating therapeutic yoga routine. Focus on alignment, joint decompression, and continuous diaphragmatic breathing.",
                phase="opening",
                duration=6.0,
                pause_after=4.0,
            )
        )
        for idx, (p_name, intro, somatic, sil) in enumerate(pose_data):
            # 1. Pose Entrance Coaching
            cues.append(
                _build_cue(
                    f"yo_g_intro_{idx}",
                    f"Let's transition into {p_name}. {intro}",
                    phase="pose_entry",
                    duration=6.0,
                    pause_after=12.0,  # 12s natural pause holding posture
                    visual_cue=sil,
                    subtitle=f"{p_name}: {intro}",
                )
            )
            # 2. Real-time Somatic Check
            cues.append(
                _build_cue(
                    f"yo_g_soma_{idx}",
                    somatic,
                    phase="somatic_check",
                    duration=4.5,
                    pause_after=12.0,  # Another 12s breath hold in shape
                    visual_cue=sil,
                    subtitle=somatic,
                )
            )
            # 3. Transition guidance
            cues.append(
                _build_cue(
                    f"yo_g_trans_{idx}",
                    "On your next exhale, gently soften your posture and prepare to transition." if is_gentle
                    else "Exhale and slowly return to neutral center.",
                    phase="transition",
                    duration=3.5,
                    pause_after=3.0,
                    visual_cue="centering",
                )
            )

        cues.append(
            _build_cue(
                "yo_g_close",
                "Take a slow, deep breath. Notice if anything in your shoulders, neck, or spine feels a little more at ease. Thank you for moving today." if is_gentle
                else "Routine complete. Musculoskeletal tension eased, postural alignment restored.",
                phase="closing",
                duration=5.0,
                pause_after=1.0,
                visual_cue="centering",
            )
        )
        est_duration = len(pose_data) * 35 + 20

    return GuidedSessionScript(
        practice_type="yoga",
        routine_id=routine,
        title=title,
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
        metadata={"routine": routine, "poses_count": len(pose_data)},
    )


# ==============================================================================
# 4. BODY SCAN RELAXATION (body_scan)
# ==============================================================================
def get_body_scan_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    regions = [
        ("head", "Head & Scalp", "Bring your gentle awareness to the crown of your head, your forehead, and scalp. Allow any furrowing behind your temples to simply soften like warm water."),
        ("jaw", "Jaw & Eyes", "Notice your jaw and teeth. Unclench gently. Let your tongue rest softly at the floor of your mouth, and allow the tiny muscles around your eyes to relax completely."),
        ("shoulders", "Neck & Shoulders", "Notice the space across your neck and collarbones. Feel your shoulders dropping a little further away from your ears. There is nothing you need to hold up right now."),
        ("chest", "Chest & Heart", "Feel the gentle rise and fall of your ribs. Notice the quiet, faithful rhythm of your heart, working steadily and kindly for you."),
        ("hands", "Arms & Hands", "Draw attention down into your arms, wrists, and the palms of your hands. Notice any warmth or tingling in your fingertips. Let your fingers curl softly into rest."),
        ("abdomen", "Abdomen & Belly", "Soften your belly completely. Let go of holding it tight. With each soft breath, let your abdomen gently expand with quiet ease."),
        ("legs", "Hips & Legs", "Feel the heavy, supported weight of your hips, thighs, and knees. Feel gravity holding you securely without any effort from your muscles."),
        ("feet", "Feet & Contact", "Bring your presence all the way down to your heels, soles, and toes. Notice how you are grounded and connected to the earth right here."),
    ]
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("bs_q_open", "Settle in comfortably. Allow your awareness to travel down your body.", phase="opening", duration=4.0, pause_after=10.0))
        cues.append(_build_cue("bs_q_mid", "Softening from head all the way to your feet.", phase="scan", duration=3.5, pause_after=25.0, region="chest"))
        cues.append(_build_cue("bs_q_close", "Your entire body is resting and at peace.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 90
    elif mode == "quick":
        # Grouped into 4 quadrants
        cues.append(_build_cue("bs_qk_open", "Let's take a quick somatic sweep down your body to release tension.", phase="opening", duration=4.0, pause_after=3.0))
        cues.append(_build_cue("bs_qk_1", "Notice your head, forehead, and jaw. Unclench your teeth and soften your brow.", phase="scan", duration=4.5, pause_after=10.0, region="head"))
        cues.append(_build_cue("bs_qk_2", "Feel your shoulders and chest. Let your shoulders drop away from your ears.", phase="scan", duration=4.5, pause_after=10.0, region="shoulders"))
        cues.append(_build_cue("bs_qk_3", "Soften your abdomen and hips. Release any holding in your stomach.", phase="scan", duration=4.5, pause_after=10.0, region="abdomen"))
        cues.append(_build_cue("bs_qk_4", "Feel your legs and feet resting heavy and grounded on the floor.", phase="scan", duration=4.5, pause_after=10.0, region="feet"))
        cues.append(_build_cue("bs_qk_close", "Carry this bodily ease with you into your day.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 120
    else:
        # Full 8-region head-to-toe guided somatic scan
        cues.append(
            _build_cue(
                "bs_g_open",
                "Welcome to Body Scan Relaxation. Find a comfortable position, either sitting or lying down. Close your eyes or soften your gaze, and allow your body to arrive." if is_gentle
                else "Commencing 8-region somatic body scan. Systematically scan muscle groups to downregulate sympathetic hyperarousal.",
                phase="opening",
                duration=6.0,
                pause_after=4.0,
            )
        )
        for r_id, r_name, guidance in regions:
            cues.append(
                _build_cue(
                    f"bs_g_{r_id}",
                    guidance if is_gentle else f"Shift focus to {r_name}. Observe local sensory feedback and consciously release holding patterns.",
                    phase="scan",
                    duration=6.5,
                    pause_after=14.0,  # 14s silence for somatic absorption
                    region=r_id,
                    visual_cue="highlight",
                    subtitle=f"{r_name}: {guidance}",
                )
            )

        cues.append(
            _build_cue(
                "bs_g_close",
                "Take a full, gentle breath in and out. Feel your whole body resting as one connected, peaceful whole. Carry this softness with you." if is_gentle
                else "Scan concluded. Somatic awareness integrated across all eight anatomical regions.",
                phase="closing",
                duration=5.5,
                pause_after=1.0,
                visual_cue="whole_body",
            )
        )
        est_duration = 320

    return GuidedSessionScript(
        practice_type="body_scan",
        title="Body Scan Relaxation",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 5. MINDFUL WALK (walk)
# ==============================================================================
def get_mindful_walk_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    walking_prompts = [
        ("walk_1", "Notice the sensation of your feet making contact with the ground. Left, right, steady and supported.", 22.0),
        ("walk_2", "Feel the temperature of the air touching your face and hands. Notice if it feels cool, warm, or still.", 25.0),
        ("walk_3", "Soften your gaze. Look ahead and notice three colors around you without needing to label or judge them.", 25.0),
        ("walk_4", "Listen to the sounds around you. First the closest sound, and then the farthest distant sound traveling in the air.", 25.0),
        ("walk_5", "Notice your breathing naturally synchronizing with the easy rhythm of your steps.", 22.0),
        ("walk_6", "You don't need to hurry to get anywhere. In this moment, simply walking is enough.", 25.0),
        ("walk_7", "Notice how your shoulders naturally settle lower with each passing step.", 22.0),
        ("walk_8", "Feel your steady connection to the path beneath you. Grounded, present, and at ease.", 20.0),
    ]
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("wk_q_open", "Begin walking at a comfortable, natural pace. Keep your gaze soft.", phase="opening", duration=4.0, pause_after=25.0))
        cues.append(_build_cue("wk_q_close", "Slow your steps gently. Notice the stillness within motion.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 120
    elif mode == "quick":
        cues.append(_build_cue("wk_qk_open", "Let's step into mindful awareness as you walk.", phase="opening", duration=3.5, pause_after=5.0))
        for c_id, text, pause in walking_prompts[:4]:
            cues.append(_build_cue(c_id, text, phase="walk_prompt", duration=4.5, pause_after=15.0, visual_cue="wave"))
        cues.append(_build_cue("wk_qk_close", "Thank you for moving with presence today.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 120
    else:
        cues.append(
            _build_cue(
                "wk_g_open",
                "Keep your phone in your pocket or held loosely by your side. You don't need to look at the screen. I will speak gentle sensory prompts every few moments." if is_gentle
                else "Begin mindful locomotion. Keep visual focus softly anchored on the path while maintaining somatic ambient awareness.",
                phase="opening",
                duration=6.0,
                pause_after=10.0,
            )
        )
        for c_id, text, pause in walking_prompts:
            cues.append(
                _build_cue(
                    c_id,
                    text if is_gentle else f"Orientation check: {text}",
                    phase="walk_prompt",
                    duration=5.0,
                    pause_after=pause,
                    visual_cue="wave",
                )
            )
        cues.append(
            _build_cue(
                "wk_g_close",
                "As your walk comes to a close, thank your body for carrying you. Carry this presence with you into your day." if is_gentle
                else "Walking protocol complete. Proprioceptive grounding affirmed.",
                phase="closing",
                duration=4.5,
                pause_after=1.0,
            )
        )
        est_duration = 300

    return GuidedSessionScript(
        practice_type="walk",
        title="Mindful Walk Presence",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 6. PROGRESSIVE MUSCLE RELAXATION (pmr)
# ==============================================================================
def get_pmr_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    groups = [
        (
            "hands",
            "Hands & Forearms",
            "Make gentle fists with both hands. Clench just firmly enough to feel the tension in your fingers and wrists.",
            "Release completely. Open your fingers wide, then let them fall completely slack and limp. Feel the sudden warmth washing in.",
        ),
        (
            "arms",
            "Upper Arms & Biceps",
            "Bend your elbows and pull your hands toward your shoulders, tensing your biceps firmly.",
            "Drop your arms heavily by your sides. Feel all that tightness melting out through your elbows and wrists like warm honey.",
        ),
        (
            "shoulders",
            "Shoulders & Neck",
            "Hike your shoulders all the way up toward your ears. Squeeze gently into the back of your neck.",
            "Let them drop completely. Feel the huge distance growing between your ears and shoulders. Nothing to carry.",
        ),
        (
            "face",
            "Face & Jaw",
            "Scrunch your eyebrows together, squint your eyes, and clench your jaw softly.",
            "Smooth everything out. Smooth your forehead, unclench your teeth, and let your jaw hang softly in complete ease.",
        ),
        (
            "chest",
            "Chest & Abdomen",
            "Take a deep breath and hold it gently, tightening your stomach muscles as if preparing for a soft impact.",
            "Breathe out in a long sigh. Let your belly become completely soft, loose, and peaceful.",
        ),
        (
            "legs",
            "Legs & Feet",
            "Curl your toes downward, flex your calves, and press your thighs down into the surface.",
            "Release all at once. Let your feet roll open. Feel your legs sinking deep and heavy into the floor.",
        ),
    ]
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("pmr_q_open", "Settle in. We will gently tense and release tension from the body.", phase="opening", duration=4.0, pause_after=6.0))
        cues.append(_build_cue("pmr_q_1", "Gently squeeze your hands and arms... and release completely.", phase="release", duration=4.0, pause_after=20.0, region="hands"))
        cues.append(_build_cue("pmr_q_close", "Your muscles are soft, heavy, and rested.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 90
    elif mode == "quick":
        # 3 core groups: upper body, torso, legs
        cues.append(_build_cue("pmr_qk_open", "Let's release stored tension through progressive contrast.", phase="opening", duration=3.5, pause_after=2.0))
        for g_id, g_name, tense_txt, rel_txt in [groups[0], groups[2], groups[5]]:
            cues.append(_build_cue(f"pmr_qk_t_{g_id}", f"Tense your {g_name} now.", phase="tense", duration=3.0, pause_after=6.0, region=g_id, visual_cue="tense"))
            cues.append(_build_cue(f"pmr_qk_r_{g_id}", rel_txt, phase="release", duration=5.0, pause_after=12.0, region=g_id, visual_cue="release"))
        cues.append(_build_cue("pmr_qk_close", "All tension has dissolved into stillness.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 130
    else:
        cues.append(
            _build_cue(
                "pmr_g_open",
                "Welcome to Progressive Muscle Relaxation. We will gently tense each muscle group for six seconds, and then release it completely to experience the contrast of true relaxation." if is_gentle
                else "Commencing Jacobson progressive muscle relaxation. Isometric contraction followed by full muscular release to induce parasympathetic vasodilation.",
                phase="opening",
                duration=7.0,
                pause_after=4.0,
            )
        )
        for g_id, g_name, tense_prompt, release_prompt in groups:
            # Tense phase
            cues.append(
                _build_cue(
                    f"pmr_g_tense_{g_id}",
                    tense_prompt,
                    phase="tense",
                    duration=5.0,
                    pause_after=6.0,  # 6s isometric contraction
                    region=g_id,
                    visual_cue="tense",
                    subtitle=f"Tense: {g_name}",
                )
            )
            # Release phase
            cues.append(
                _build_cue(
                    f"pmr_g_release_{g_id}",
                    release_prompt,
                    phase="release",
                    duration=5.5,
                    pause_after=14.0,  # 14s deep relaxation contrast
                    region=g_id,
                    visual_cue="release",
                    subtitle=f"Release: {g_name}",
                )
            )

        cues.append(
            _build_cue(
                "pmr_g_close",
                "Feel your entire body resting heavily and peacefully. There is nothing left to hold onto. You are completely relaxed." if is_gentle
                else "PMR protocol complete. Global muscular hypertonicity resolved.",
                phase="closing",
                duration=5.0,
                pause_after=1.0,
                visual_cue="still",
            )
        )
        est_duration = len(groups) * 32 + 20

    return GuidedSessionScript(
        practice_type="pmr",
        title="Progressive Muscle Relaxation",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 7. SELF-COMPASSION PRACTICE (self_compassion)
# ==============================================================================
def get_self_compassion_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("sc_q_open", "Place a hand gently on your heart. Breathe softly into this space.", phase="opening", duration=4.0, pause_after=15.0))
        cues.append(_build_cue("sc_q_close", "May you be kind and gentle with yourself.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 90
    elif mode == "quick":
        cues.append(_build_cue("sc_qk_open", "Let's pause for a 3-step self-compassion break.", phase="opening", duration=3.0, pause_after=2.0))
        cues.append(_build_cue("sc_qk_1", "Acknowledge: This is a moment of real struggle. It is okay that this feels hard.", phase="mindfulness", duration=4.5, pause_after=10.0))
        cues.append(_build_cue("sc_qk_2", "Remember: Difficulty is part of being human. You are not broken or alone.", phase="humanity", duration=4.5, pause_after=10.0))
        cues.append(_build_cue("sc_qk_3", "Place a hand on your heart: May I offer myself the kindness I need right now.", phase="kindness", duration=4.5, pause_after=12.0))
        cues.append(_build_cue("sc_qk_close", "You are worthy of kindness exactly as you are.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 110
    else:
        # Full clinical 3-phase self-compassion break
        cues.append(
            _build_cue(
                "sc_g_open",
                "Welcome to your Self-Compassion Practice. Take a slow, comforting breath. We often speak to ourselves more harshly than to anyone else. Today, we practice shifting into warmth." if is_gentle
                else "Commencing 3-phase clinical self-compassion intervention based on Neff & Germer framework: Mindfulness, Common Humanity, and Self-Kindness.",
                phase="opening",
                duration=6.5,
                pause_after=4.0,
            )
        )
        # Phase 1: Mindfulness (Validating pain)
        cues.append(
            _build_cue(
                "sc_g_p1",
                "Phase One: Mindful Acknowledgment. Gently bring to mind whatever difficulty or stress you are carrying. Without judging yourself, simply say inwardly: This is a moment of real struggle. This hurts, and my pain is valid." if is_gentle
                else "Phase 1: Mindfulness. Recognize and label the distress without cognitive avoidance or over-identification.",
                phase="mindfulness",
                duration=7.5,
                pause_after=18.0,  # 18s pause for reflection
                visual_cue="heart",
                subtitle="Phase 1: Mindful Acknowledgment",
            )
        )
        # Phase 2: Common Humanity
        cues.append(
            _build_cue(
                "sc_g_p2",
                "Phase Two: Common Humanity. Remember that suffering and difficulty are universal threads of human existence. You are not flawed, isolated, or broken for having a hard time. Millions of others feel this exact kind of ache.",
                phase="humanity",
                duration=7.5,
                pause_after=18.0,
                visual_cue="humanity",
                subtitle="Phase 2: Common Humanity",
            )
        )
        # Phase 3: Self-Kindness
        cues.append(
            _build_cue(
                "sc_g_p3",
                "Phase Three: Unconditional Kindness. Place one or both hands softly over your heart or on your arm. Feel the physical warmth of your hands. Whisper to yourself: May I be gentle with myself. May I give myself the compassion I need.",
                phase="kindness",
                duration=8.0,
                pause_after=20.0,
                visual_cue="hands_on_heart",
                subtitle="Phase 3: Unconditional Kindness",
            )
        )
        cues.append(
            _build_cue(
                "sc_g_close",
                "You do not have to earn kindness today. You are worthy of warmth simply because you are here. Carry this softness with you." if is_gentle
                else "Self-compassion protocol complete. Internal threat system modulated by affiliative soothing.",
                phase="closing",
                duration=5.5,
                pause_after=1.0,
            )
        )
        est_duration = 240

    return GuidedSessionScript(
        practice_type="self_compassion",
        title="Mindful Self-Compassion Break",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 8. QUIET PAUSE (quiet)
# ==============================================================================
def get_quiet_script(
    mode: str = "quiet",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    cues: List[VoiceCue] = [
        _build_cue(
            "qt_open",
            "Allow yourself to simply arrive in stillness. There is nothing you need to accomplish right now." if is_gentle
            else "Entering silent recovery interval. Rest without cognitive tasks.",
            phase="opening",
            duration=4.0,
            pause_after=15.0,
        ),
        _build_cue(
            "qt_mid",
            "Stillness is always here whenever you need to rest." if is_gentle
            else "Maintaining quiet parasympathetic pause.",
            phase="anchor",
            duration=3.0,
            pause_after=25.0,
        ),
        _build_cue(
            "qt_close",
            "Whenever you feel ready, softly open your eyes and carry this peace forward." if is_gentle
            else "Quiet interval concluding.",
            phase="closing",
            duration=3.5,
            pause_after=1.0,
        ),
    ]

    return GuidedSessionScript(
        practice_type="quiet",
        title="Quiet Pause",
        mode=mode,
        estimated_duration_seconds=custom_seconds or 180,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# ==============================================================================
# 9. SLEEP SANCTUARY (sleep)
# ==============================================================================
def get_sleep_script(
    mode: str = "guided",
    tone: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    is_gentle = tone != "practical"
    cues: List[VoiceCue] = []

    if mode == "quiet":
        cues.append(_build_cue("sl_q_open", "Settle deep into your bed. Let the day gently fade away.", phase="opening", duration=4.5, pause_after=20.0))
        cues.append(_build_cue("sl_q_close", "Safe to sleep now. Goodnight.", phase="closing", duration=3.0, pause_after=1.0))
        est_duration = 180
    elif mode == "quick":
        cues.append(_build_cue("sl_qk_open", "Let's help your mind slow down for sleep.", phase="opening", duration=3.5, pause_after=4.0))
        cues.append(_build_cue("sl_qk_1", "Let your shoulders and arms sink into the mattress.", phase="winddown", duration=3.5, pause_after=15.0))
        cues.append(_build_cue("sl_qk_2", "There is nothing else you need to carry or solve tonight.", phase="winddown", duration=4.0, pause_after=18.0))
        cues.append(_build_cue("sl_qk_close", "You are safe to rest. Soft dreams.", phase="closing", duration=3.5, pause_after=1.0))
        est_duration = 150
    else:
        # Full sleep sanctuary bedtime wind-down with slow pacing and extended pauses
        cues.append(
            _build_cue(
                "sl_g_open",
                "Welcome to Sleep Sanctuary. Settle your head into the pillow and let your hands rest by your sides. The day is behind you now. There is nothing else you need to solve tonight.",
                phase="opening",
                duration=6.5,
                pause_after=12.0,
                visual_cue="moon",
            )
        )
        cues.append(
            _build_cue(
                "sl_g_1",
                "Take a long, slow breath in... and exhale with a gentle sigh. Feel the weight of gravity drawing you deep into the bed.",
                phase="breathing",
                duration=5.5,
                pause_after=18.0,
                visual_cue="exhale",
            )
        )
        cues.append(
            _build_cue(
                "sl_g_2",
                "Unclench your jaw. Let your tongue rest softly, and let the tiny muscles around your eyes surrender completely.",
                phase="somatic_release",
                duration=5.5,
                pause_after=20.0,
                visual_cue="soften",
            )
        )
        cues.append(
            _build_cue(
                "sl_g_3",
                "Whatever remained unfinished today, you have permission to leave it right here. Tomorrow will take care of itself.",
                phase="cognitive_release",
                duration=6.0,
                pause_after=22.0,
                visual_cue="stars",
            )
        )
        cues.append(
            _build_cue(
                "sl_g_4",
                "Feel your body becoming heavy, warm, and deeply supported. Sinking lower and lower with every quiet breath.",
                phase="deep_rest",
                duration=5.5,
                pause_after=25.0,
                visual_cue="fade",
            )
        )
        cues.append(
            _build_cue(
                "sl_g_close",
                "Safe to drift... safe to let go... into quiet, peaceful sleep.",
                phase="fade_out",
                duration=5.0,
                pause_after=1.0,
                visual_cue="silence",
            )
        )
        est_duration = 360

    return GuidedSessionScript(
        practice_type="sleep",
        title="Sleep Sanctuary Wind-Down",
        mode=mode,
        estimated_duration_seconds=custom_seconds or est_duration,
        tone_preference=tone,
        voice_style=voice_style,
        cues=cues,
    )


# Master Dispatcher
SCRIPT_GENERATORS = {
    "breathe": get_breathing_script,
    "ground": get_grounding_script,
    "yoga": get_yoga_script,
    "body_scan": get_body_scan_script,
    "walk": get_mindful_walk_script,
    "pmr": get_pmr_script,
    "self_compassion": get_self_compassion_script,
    "quiet": get_quiet_script,
    "sleep": get_sleep_script,
}


def generate_guided_script(
    practice_type: str,
    routine_id: Optional[str] = None,
    mode: str = "guided",
    tone_preference: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
) -> GuidedSessionScript:
    """Generates an orchestrated session script for any of the 9 studio practices."""
    p = (practice_type or "breathe").lower()
    generator = SCRIPT_GENERATORS.get(p)
    if not generator:
        p = "breathe"
        generator = get_breathing_script

    if p == "yoga":
        return generator(
            routine_id=routine_id,
            mode=mode,
            tone=tone_preference,
            voice_style=voice_style,
            custom_seconds=custom_seconds,
        )

    return generator(
        mode=mode,
        tone=tone_preference,
        voice_style=voice_style,
        custom_seconds=custom_seconds,
    )
