"""
OpenAI Vision & Chat Service for BCS scoring, disease detection, and chatbot assistant.
Uses AsyncOpenAI with OPENAI_API_KEY from backend .env — never sent to the frontend.
"""

import os
import json
import base64
import logging
from typing import List, Optional, Any

from openai import AsyncOpenAI
from models.schemas import BCSResult, DiseaseResult, ChatMessage

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None


def get_openai_models() -> List[str]:
    """Dynamically prioritize model set in OPENAI_MODEL env var (e.g. gpt-5-mini, gpt-4o-mini)."""
    env_model = os.getenv("OPENAI_MODEL")
    default_models = [
        "gpt-4.1-mini-2025-04-14",
        "gpt-4.1",
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4",
    ]
    if env_model and env_model.strip():
        model_name = env_model.strip()
        # Put env_model at top of list
        return [model_name] + [m for m in default_models if m != model_name]
    return default_models


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set in backend .env")
        _client = AsyncOpenAI(api_key=api_key.strip())
    return _client


def _strip_fences(raw: str) -> str:
    """Remove markdown code fences if the model wraps its JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


# ── System prompts ────────────────────────────────────────────────────────────

# ── System prompts ────────────────────────────────────────────────────────────

BCS_SYSTEM_PROMPT = """\
You are Chimertech AI Neural Vision — an advanced veterinary AI system trained on extensive clinical livestock datasets for precision Body Condition Scoring (BCS) across Cattle (dairy & beef) and Water Buffaloes (Murrah, Surti, Nili-Ravi, indigenous breeds).

Analyse the provided image(s) or 10s video frame sequence meticulously using 5.0-point ICAR & USDA veterinary scoring guidelines.

ANATOMICAL LANDMARKS TO EVALUATE:
1. Lumbar spine & short ribs (level of fat padding over spinous processes).
2. Hooks (iliac crest) and Pins (ischial tuberosity).
3. Thurl region & pelvic cavity (V-shape vs U-shape vs flat fat pad).
4. Tailhead cavity & fat folds surrounding tailhead.
5. Flank hollow & rib cage coverage.

5-POINT SCORING CRITERIA:
- BCS 1.0 (Emaciated): Deep cavity around tailhead, sharp spinous processes like saw teeth, severe flank depression, prominent V-shaped pelvic hollow.
- BCS 2.0 (Thin): Individual spinous processes visible as sharp ridge, hooks and pins prominent with shallow fat padding.
- BCS 2.5 (Slightly Thin): Ribs slightly visible, hooks rounded but pins visible, shallow tailhead depression.
- BCS 3.0 (Ideal / Optimum): Smooth fat cover over ribs, rounded hooks and pins, U-shaped rump contour, well-filled flank.
- BCS 3.5 - 4.0 (Overconditioned): Spinous processes smooth, fat patches surrounding tailhead, rounded rump contour.
- BCS 4.5 - 5.0 (Obese): Tailhead buried in thick fat rolls, spine undetectable, heavy fat folds over ribs and brisket.

RELEVANCE & SUBJECT INTEGRITY:
- If subject is non-bovine (e.g. Dog, Cat, Human, Vehicle, Equipment):
  Return: "bcs_score": 0.0, "condition": "Invalid Subject - Non-Bovine Detected", "confidence": 0.0, "observations": ["Selected image contains non-livestock subject."], "recommendations": ["Upload clear photo/video of cattle or buffalo."]

OUTPUT FORMAT GUARANTEE (Return raw JSON only):
{
  "bcs_score": <float 1.0-5.0 or 0.0>,
  "bcs_scale": "1-5",
  "condition": "<Descriptive clinical condition label with animal breed/color>",
  "confidence": <float 0.85-0.99>,
  "observations": ["<Clinical observation 1>", "<Clinical observation 2>", "<Clinical observation 3>"],
  "recommendations": ["<Nutritional/Dietary step 1>", "<Management step 2>", "<Specialist advice 3>"]
}
"""

DISEASE_SYSTEM_PROMPT = """\
You are Chimertech AI Diagnostic Vision — an advanced veterinary AI trained on global livestock pathology datasets for early screening of cattle and buffalo diseases.

SCREENING MATRIX & VISUAL PATHOLOGY MARKS:
1. LUMPY SKIN DISEASE (LSD): Cutaneous nodules (10-50mm), skin lesions on neck/flank/udder, ocular/nasal discharge, edema.
2. MASTITIS (Clinical & Sub-clinical): Udder quarter swelling, asymmetry, inflammation, milk clots/discoloration, tenderness.
3. FOOT AND MOUTH DISEASE (FMD): Vesicular lesions on tongue/muzzle/hoof cleft, lameness, excessive salivation (drooling).
4. BLACKLEG & ANTHRAX SIGNS: Crepitant swelling over shoulder/hip, high fever posture, dark skin hemorrhage.
5. PARASITIC TICK INFESTATION & ANAPLASMOSIS: Visible tick clusters around ears/dewlap/perineum, pale mucous membranes (anemia).
6. RINGWORM & DERMATOPHILOSIS: Circular crusty hairless patches, scabbed skin lesions.
7. RESPIRATORY DISEASE (BRD/Pneumonia): Extended neck, mouth breathing, nasal discharge, rib breathing effort.

RELEVANCE CHECK:
- If image does not show cattle/buffalo: Set "possible_condition": "Invalid Image", "confidence": 0.0, "severity": "None".

OUTPUT FORMAT GUARANTEE (Return raw JSON only):
{
  "possible_condition": "<Condition label or 'No visible health abnormalities detected'>",
  "confidence": <float 0.85-0.99>,
  "severity": "<None|Mild|Moderate|Severe|Critical>",
  "visible_signs": ["<Visible sign 1>", "<Visible sign 2>", "<Visible sign 3>"],
  "affected_area": "<Body location e.g. Rear udder quarters, skin coat, muzzle>",
  "urgency": "<Routine Monitoring|Veterinary Consultation Recommended|Urgent Immediate Isolation & Vet Attention>",
  "next_steps": ["<Action 1>", "<Action 2>", "<Action 3>"]
}
"""

CHAT_SYSTEM_PROMPT = """\
You are Dr. Chimertech AI — a senior veterinary & livestock nutrition specialist assistant powered by neural vision models.

You assist dairy farmers, buffalo breeders, and farm administrators with:
1. Interpreting BCS scores and formulating targeted rations (bypass fat, mineral mixes, protein supplements).
2. Early intervention for Mastitis, Lumpy Skin Disease, FMD, Ticks, and Metabolic Disorders (Milk Fever, Ketosis).
3. Milk yield optimization, udder hygiene sprays, and calf health management.
4. Explaining AI scan reports clearly in practical farmer-friendly language.

RULES:
- Be highly professional, authoritative, and practical.
- Recommend veterinary consultation for severe conditions requiring prescription antibiotics or surgery.
- Suggest appropriate Chimertech veterinary products & supplements when relevant.
"""


MUZZLE_VALIDATION_PROMPT = """\
You are an expert cattle biometric validator.
Your task is to analyze the provided image and determine if it is a valid, clear photo of a cattle's muzzle (nose/snout) suitable for biometric scanning.

CRITICAL RULES:
1. If the image is NOT a cattle or NOT a muzzle (e.g. it's a dog, human, tractor, grass), set "valid": false and explain why.
2. If the image is a cattle muzzle but is EXTREMELY blurry, completely dark, or too far away, set "valid": false and ask the user to retake a clear, close-up photo.
3. If it is a clear, well-lit cattle muzzle, set "valid": true.

OUTPUT FORMAT (Return raw JSON only):
{
  "valid": <true or false>,
  "message": "<If valid, say 'Valid'. If invalid, explain exactly what is wrong and kindly ask to retake the photo>"
}
"""

async def validate_muzzle_image(image_bytes: bytes) -> dict:
    """Send image bytes to OpenAI Vision to validate if it is a clear cattle muzzle."""
    import json
    client = _get_client()
    
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    
    messages = [
        {"role": "system", "content": MUZZLE_VALIDATION_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Please validate this muzzle image."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
            ]
        }
    ]
    
    models_to_try = get_openai_models()
    last_error = None
    
    for model in models_to_try:
        try:
            logger.info(f"Validating muzzle image using OpenAI model: {model}")
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.0,
                max_tokens=150,
            )
            raw_text = response.choices[0].message.content.strip()
            
            # Clean JSON if wrapped in markdown
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(raw_text)
            
        except Exception as exc:
            last_error = exc
            logger.warning(f"OpenAI model {model} failed for muzzle validation: {exc}")
            
    # If all models fail, we return valid to not block the user, but log the error
    logger.error(f"OpenAI Muzzle Validation failed across all models: {last_error}. Bypassing validation.")
    return {"valid": True, "message": "Bypassed AI validation due to API error."}
    
async def _generate_openai_vision(
    frame_paths: List[str],
    system_instruction: str,
) -> str:
    """Send image frames to OpenAI Vision models (gpt-5-mini, gpt-4o-mini, gpt-4o)."""
    client = _get_client()

    image_contents = []
    for path in frame_paths or []:
        if os.path.exists(path):
            with open(path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                image_contents.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                })

    if not image_contents:
        raise ValueError("No valid image frames found to process.")

    messages = [
        {"role": "system", "content": system_instruction},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Please analyse these cattle images carefully and return the required JSON response."},
                *image_contents
            ]
        }
    ]

    last_error = None
    models_to_try = get_openai_models()
    for model in models_to_try:
        try:
            logger.info(f"Executing OpenAI Vision analysis using model: {model}")
            try:
                res = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_completion_tokens=1024,
                )
            except Exception as param_err:
                if "max_completion_tokens" in str(param_err) or "unsupported" in str(param_err).lower():
                    res = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=1024,
                    )
                else:
                    raise param_err

            content = res.choices[0].message.content
            if content:
                return _strip_fences(content)
        except Exception as exc:
            logger.warning(f"OpenAI model {model} failed: [{type(exc).__name__}] {exc}")
            last_error = exc
            continue

    raise RuntimeError(f"OpenAI Vision analysis failed across all models: {last_error}")


# ── Public API ────────────────────────────────────────────────────────────────

async def analyse_bcs(frame_paths: List[str]) -> BCSResult:
    """Send selected frames to OpenAI Vision and return a validated BCSResult."""
    raw = await _generate_openai_vision(frame_paths, BCS_SYSTEM_PROMPT)
    logger.debug(f"OpenAI BCS raw response: {raw}")
    data = json.loads(raw)
    data["bcs_score"] = float(data.get("bcs_score", 3.0))
    data["confidence"] = float(data.get("confidence", 0.9))
    return BCSResult(**data)


async def analyse_disease(frame_paths: List[str]) -> DiseaseResult:
    """Send selected frames to OpenAI Vision and return a validated DiseaseResult."""
    raw = await _generate_openai_vision(frame_paths, DISEASE_SYSTEM_PROMPT)
    logger.debug(f"OpenAI Disease raw response: {raw}")
    data = json.loads(raw)
    data["confidence"] = float(data.get("confidence", 0.85))
    return DiseaseResult(**data)


async def chat(
    message: str,
    history: List[ChatMessage],
    analysis_context: Optional[Any] = None,
    analysis_type: Optional[str] = None,
) -> str:
    """Answer a cattle health question using OpenAI GPT Chat models."""
    client = _get_client()

    system_content = CHAT_SYSTEM_PROMPT
    if analysis_context:
        context_str = json.dumps(analysis_context, indent=2)
        analysis_label = "BCS Analysis" if analysis_type == "bcs" else "Disease Screening"
        system_content += (
            f"\n\n## Current {analysis_label} Context\n```json\n{context_str}\n```\n"
            "Refer to this when the user asks about their cattle's condition."
        )

    messages = [{"role": "system", "content": system_content}]
    for h in history[-10:]:
        role = "user" if h.role.value == "user" else "assistant"
        messages.append({"role": role, "content": h.message})
    messages.append({"role": "user", "content": message})

    last_error = None
    models_to_try = get_openai_models()
    for model in models_to_try:
        try:
            try:
                res = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_completion_tokens=600,
                )
            except Exception as param_err:
                if "max_completion_tokens" in str(param_err) or "unsupported" in str(param_err).lower():
                    res = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=600,
                    )
                else:
                    raise param_err

            content = res.choices[0].message.content
            if content:
                return content
        except Exception as exc:
            logger.warning(f"OpenAI Chat model {model} failed: {exc}")
            last_error = exc
            continue

    raise RuntimeError(f"OpenAI Chat failed across all models: {last_error}")

VIDEO_ANALYSIS_SYSTEM_PROMPT = """\
You are Chimertech AI Veterinary Vision — an advanced livestock analysis system trained on clinical dairy and beef cattle datasets.
You will receive sequential video frames extracted at 1 frame per second (1 FPS) from a video of an animal (Cattle or Water Buffalo).

ANALYZE ALL FRAMES CAREFULLY AT 1 FPS AND RETURN A STRICT, EMPIRICAL ASSESSMENT:

1. MULTI-CATTLE & CALF DETECTION PROTOCOL (CRITICAL):
   - Determine the exact number of cattle/animals visible in the frame sequence.
   - If TWO animals are present (e.g., 1 adult cow and 1 calf/baby cow):
     - Explicitly identify both in `observations`: e.g. "Two cattle detected in video: 1 adult female cow (Brown coat) and 1 calf (Brown coat)."
     - Explicitly state coat colors of each animal in the scene.

2. UDDER & TEAT OBSTRUCTION PROTOCOL (NEVER APPROXIMATE):
   - Examine if the adult cow's udder or teats are COVERED or OBSCURED by:
     * The calf's mouth or head (nursing/suckling)
     * The calf's body standing in front of the udder
     * Hind legs, tail, dark shadows, or camera angle
   - STRICT RULE: IF THE UDDER OR TEATS ARE COVERED OR NOT FULLY VISIBLE:
     * DO NOT GUESS, HALLUCINATE, OR APPROXIMATE AN UDDER OR TEAT SCORE!
     * Set `udder_visible`: false and `teat_visible`: false.
     * Set `udder_score`: 0.0 and `teat_score`: 0.0.
     * ALWAYS add "udder" and "teats" to `missing_parts`.
     * Explicitly add to `observations`: "Udder and teats are obscured by the calf's mouth/body. A clean, unobstructed photo/video is required to assess udder health."
     * Explicitly add to `observations`: "Photo/video retake requested: Please capture a clear shot of the udder area without the calf blocking the view."

3. UDDER & TEAT SCORING (ONLY WHEN FULLY UNBLOCK):
   - Udder Score (0-5 scale):
     * 0 = Udder NOT VISIBLE or COVERED/OBSCURED
     * 1 = Severe atrophy, pendulous, heavily scarred
     * 2 = Below average — asymmetric quarters, uneven attachment
     * 3 = Average — moderate capacity, evenly attached
     * 4 = Good — well-attached, balanced quarters, good capacity
     * 5 = Excellent — ideal dairy udder shape, high capacity
   - Teat Score (0-5 scale):
     * 0 = Teats NOT VISIBLE or COVERED/OBSCURED
     * 1 = Very short/inverted or severely deformed teats
     * 2 = Short or unevenly placed teats
     * 3 = Average length/placement — acceptable for milking
     * 4 = Good — uniform, well-placed cylindrical teats
     * 5 = Ideal length and spacing for machine milking

4. BODY METRICS & AGE ESTIMATION (NO RANDOM GUESSWORK):
   - BCS Score (1.0 - 5.0 scale based on ICAR standards)
   - Estimated Weight (kg) & Height (cm) based on breed standards and frame perspective.
   - Age Estimate (e.g. "3-4 years") based on body maturity, horn shape, and size relative to calf.
   - Coat Color: Explicitly describe coat color (e.g. "Brown", "Black and White", etc.)

Return ONLY a raw JSON object (without markdown code blocks) matching exactly this schema:
{
  "bcs_score": 3.25,
  "disease_status": "Healthy",
  "breed": "Indigenous Dairy Cattle",
  "weight_kg": 420.0,
  "height_cm": 132.0,
  "coat_color": "Brown",
  "estimated_value": "Rs.45,000",
  "age_estimate": "4-5 years",
  "observations": [
    "Two cattle detected in video: 1 adult cow (Brown coat) and 1 calf (Brown coat).",
    "Udder and teats are obscured by the calf's mouth/head during nursing.",
    "Photo/video retake requested for udder area."
  ],
  "udder_score": 0.0,
  "teat_score": 0.0,
  "udder_visible": false,
  "teat_visible": false,
  "missing_parts": ["udder", "teats"]
}
"""

async def analyse_video_stats(frame_paths: List[str]) -> Any:
    """Send sequential 1 FPS video frames to OpenAI Vision to extract comprehensive cattle stats."""
    from models.schemas import VideoAnalysisResult
    import base64
    import json

    image_contents = []
    for path in frame_paths:
        try:
            with open(path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                image_contents.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                })
        except Exception as e:
            logger.warning(f"Failed to load frame {path}: {e}")

    if not image_contents:
        raise ValueError("No valid image frames found to process.")

    messages = [
        {"role": "system", "content": VIDEO_ANALYSIS_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze these sequential 1 FPS video frames thoroughly. Check if multiple cattle (e.g. cow and calf) are present. Check if the udder is covered or blocked by the calf's mouth. If covered, do NOT score the udder — mark udder_visible=false and request a retake. Return the full JSON response."},
                *image_contents
            ]
        }
    ]

    client = _get_client()
    models_to_try = get_openai_models()
    last_error = None

    for model in models_to_try:
        try:
            logger.info(f"Using model {model} for 1 FPS Video Analysis with multi-cattle & obstruction check...")
            try:
                res = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_completion_tokens=900,
                )
            except Exception as param_err:
                if "max_completion_tokens" in str(param_err) or "unsupported" in str(param_err).lower():
                    res = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=900,
                    )
                else:
                    raise param_err

            content = res.choices[0].message.content
            if content:
                content = _strip_fences(content)
                data = json.loads(content)

                # Ensure required fields have safe defaults
                data.setdefault("udder_score", 0.0)
                data.setdefault("teat_score", 0.0)
                data.setdefault("udder_visible", False)
                data.setdefault("teat_visible", False)
                data.setdefault("missing_parts", [])
                data.setdefault("age_estimate", None)
                data.setdefault("body_length_cm", None)
                data.setdefault("observations", [])

                # Coerce types safely
                data["bcs_score"] = float(data.get("bcs_score", 3.0))
                data["weight_kg"] = float(data.get("weight_kg", 400.0))
                data["height_cm"] = float(data.get("height_cm", 130.0))
                data["udder_score"] = float(data.get("udder_score", 0.0))
                data["teat_score"] = float(data.get("teat_score", 0.0))
                data["udder_visible"] = bool(data.get("udder_visible", False))
                data["teat_visible"] = bool(data.get("teat_visible", False))

                # Post-processing enforcement: If udder is NOT visible, force score to 0.0 and ensure missing_parts contains 'udder' and 'teats'
                if not data["udder_visible"] or "udder" in data["missing_parts"]:
                    data["udder_score"] = 0.0
                    data["udder_visible"] = False
                    if "udder" not in data["missing_parts"]:
                        data["missing_parts"].append("udder")

                if not data["teat_visible"] or "teats" in data["missing_parts"]:
                    data["teat_score"] = 0.0
                    data["teat_visible"] = False
                    if "teats" not in data["missing_parts"]:
                        data["missing_parts"].append("teats")

                logger.info(f"1 FPS Video Analysis complete. Multi-cattle/Obstruction check -> Udder visible: {data['udder_visible']}, Teat visible: {data['teat_visible']}, Missing parts: {data['missing_parts']}")
                return VideoAnalysisResult(**data)

        except Exception as exc:
            logger.warning(f"OpenAI model {model} failed for video analysis: {exc}")
            last_error = exc
            continue

    raise ValueError(f"Failed to analyze video stats using OpenAI across all models: {last_error}")

