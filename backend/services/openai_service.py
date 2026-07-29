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

OPENAI_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini-2025-04-14",
    "gpt-4.1",
    "gpt-4",
]


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

BCS_SYSTEM_PROMPT = """\
You are an expert livestock nutritionist and veterinary professional specializing in cattle and buffalo body condition scoring (BCS).
Analyse the provided image(s) or video frames carefully using standard 1.0 to 5.0 veterinary scales.

VETERINARY BCS SCALING STANDARDS (1.0 - 5.0):

CATTLE 5-POINT SCALE:
- 1.0 (Emaciated): Deep cavity around tailhead, sharp spinous processes, severe muscle wasting, prominent hooks and pins with deep V-shaped depression.
- 2.0 (Thin): Shallow cavity around tailhead, individual spinous processes visible as sharp ridge, hooks and pins sharp.
- 3.0 (Ideal / Moderate): Tailhead area smooth with light fat cover, spinous processes rounded, hooks and pins rounded with U-shaped depression.
- 4.0 (Overconditioned): Tailhead surrounded by patches of fat, spinous processes flat/felt only with firm pressure, heavy fat pads on pins.
- 5.0 (Obese): Tailhead buried in thick fat, spinous processes undetectable, hooks and pins completely covered by thick fat folds.

WATER BUFFALO 5-POINT SCALE (ICAR Standards):
- 1.0 (Emaciated / Very Poor): Deep hollows between hooks and pins, visible ribs, sharp rump bones, severe pelvic hollow.
- 2.0 (Thin / Poor): Ribs and spine clearly visible, thin skin over hip bones, shallow flank fill.
- 3.0 (Ideal / Good): Smooth contour over rump, moderate fat cover on pin bones and ribs, well-filled flank.
- 4.0 (Fat / Heavy): Thick fat layer over ribs and rump, heavy brisket fill, smooth rounded hips.
- 5.0 (Obese / Very Heavy): Heavy fat folds at tailhead, rump, and brisket, deep fat rolls around hips.

CRITICAL RULES & RELEVANCE CHECK:
1. SPECIFIC UNRELATED IMAGE IDENTIFICATION:
   - Identify specifically what subject is in the frame.
   - If the image contains a non-bovine animal or object (e.g., Dog, Cat, Human, Vehicle, Building):
     - Set "bcs_score": 0.0
     - Set "condition": "Invalid Image - Non-Bovine Detected"
     - Set "confidence": 0.0
     - In "observations": ["Unrelated image detected: Image contains a [SPECIFIC_OBJECT_OR_ANIMAL e.g., Dog / Human / Car] instead of cattle or buffalo.", "BCS scoring cannot be performed on non-bovine subjects."]
     - In "recommendations": ["Please upload a clear video or photo of cattle or female buffalo for BCS scoring."]

2. ANIMAL TYPE, SPECIES, GENDER & COLOR IDENTIFICATION:
   - Explicitly state the animal species and coat color (e.g., Female Water Buffalo, Black & White Holstein Cow, Brown Jersey Cow, Black Indigenous Cattle).
   - Differentiate clearly between cattle and female buffalo.

3. MULTIPLE ANIMALS IN ONE FRAME:
   - If 2 or more cattle/buffaloes are visible in a single frame:
     - Distinctly identify each animal by coat color and position (e.g., "Animal 1 (Left, Black & White Holstein): BCS 3.25 - Ideal condition", "Animal 2 (Right, Brown Cow): BCS 2.75 - Slightly thin").
     - Set the primary `bcs_score` to the main/center animal in the frame, and describe all animals in `observations`.

4. ANATOMICAL VIEW & ACCURATE FULL-RANGE BCS SCORING (1.0 - 5.0):
   - Evaluate fat cover across the entire 1.0 to 5.0 scale without defaulting to 2.0 or 3.0:
     * BCS 1.0 - 2.0 (Thin): Ribs & spine clearly visible as sharp ridges, deep pelvic hollow, sharp pin/hook bones.
     * BCS 2.75 - 3.25 (Ideal): Smooth fat cover, rounded hooks & pins, U-shaped depression at tailhead.
     * BCS 3.75 - 4.25 (Overconditioned / Fat): Ribs completely covered & smooth, thick fat patches around tailhead, heavy fat pads on pin bones.
     * BCS 4.5 - 5.0 (Obese / Heavy): Tailhead buried in thick fat folds, spinous processes undetectable, heavy fat rolls over hips and ribs.
   - If view is inadequate (e.g., face close-up, ear tag only, hoof only):
     - Set "bcs_score": 0.0
     - Set "condition": "Inadequate View for BCS"
     - Set "confidence": 0.25
     - In "observations": ["Subject identified as [Cattle/Buffalo color], but key BCS anatomical views (back, hips, tailhead) are obscured or missing."]
     - In "recommendations": ["Capture images/video from a rear-three-quarters or top view showing the hips, back, and tailhead."]

Required JSON format:
{
  "bcs_score": <float 1.0-5.0 or 0.0 if invalid>,
  "bcs_scale": "1-5",
  "condition": "<Descriptive Label e.g. Ideal Condition - Female Water Buffalo (Black)>",
  "confidence": <float 0.0-1.0>,
  "observations": ["<Specific observation 1>", "<Specific observation 2>", "..."],
  "recommendations": ["<Actionable recommendation 1>", "<Actionable recommendation 2>", "..."]
}
"""

DISEASE_SYSTEM_PROMPT = """\
You are a veterinary professional screening cattle images for visible health concerns.
Identify any visible signs such as udder swelling, skin lesions, tick presence, or lameness posture.

IMPORTANT SAFETY & COMPLIANCE RULES:
- Provide a PRELIMINARY SCREENING ONLY — never diagnose
- Always recommend consulting a licensed veterinarian
- Identify visible physical abnormalities on skin, eyes, hooves, udder, or coat
- If the image does not show cattle/buffalo, return:
  "possible_condition": "Invalid Image", "confidence": 0.0, "severity": "None"
- This is a SCREENING TOOL ONLY — never claim a confirmed diagnosis
- Only report what is visibly detectable
- If no visible abnormalities, state that clearly
- Use appropriate veterinary terminology
- Return ONLY a valid JSON object — no markdown, no explanations

Required JSON format:
{
  "possible_condition": "<descriptive label or 'No visible abnormalities detected'>",
  "confidence": <float 0.0-1.0>,
  "severity": "<None|Mild|Moderate|Severe>",
  "visible_signs": ["<sign 1>", "..."],
  "affected_area": "<body area or 'N/A'>",
  "urgency": "<monitoring|veterinary consultation recommended|urgent veterinary attention>",
  "next_steps": ["<step 1>", "..."]
}
"""

CHAT_SYSTEM_PROMPT = """\
You are a helpful, knowledgeable cattle health assistant for Chimertech, a company that
provides cattle health management products and tools.

You assist farmers and livestock managers with:
- Cattle body condition scoring (BCS)
- Disease screening and prevention
- Udder health and mastitis detection
- Feeding and nutrition guidance
- Milk quality testing
- When to contact a veterinarian
- Chimertech product usage

IMPORTANT RULES:
- Never confirm a disease diagnosis — always recommend veterinary consultation for certainty
- Be practical, clear and farmer-friendly
- Reference the provided analysis context when relevant
- Suggest appropriate Chimertech products when relevant to the question
- Keep responses concise and actionable
"""


async def _generate_openai_vision(
    frame_paths: List[str],
    system_instruction: str,
) -> str:
    """Send image frames to OpenAI Vision models (gpt-4o-mini, gpt-4o, gpt-4.1)."""
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
    for model in OPENAI_MODELS:
        try:
            logger.info(f"Executing OpenAI Vision analysis using model: {model}")
            res = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.2,
                max_tokens=1024,
            )
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
    for model in OPENAI_MODELS:
        try:
            res = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.4,
                max_tokens=600,
            )
            content = res.choices[0].message.content
            if content:
                return content
        except Exception as exc:
            logger.warning(f"OpenAI Chat model {model} failed: {exc}")
            last_error = exc
            continue

    raise RuntimeError(f"OpenAI Chat failed across all models: {last_error}")
