"""
Gemini Vision service for BCS scoring and disease detection.
Uses the new google-genai SDK (google.generativeai is deprecated).
The GEMINI_API_KEY lives ONLY in the backend .env — never sent to the frontend.
"""

import json
import logging
from pathlib import Path
from typing import List, Optional, Any

from google import genai
from google.genai import types
from PIL import Image

from models.schemas import BCSResult, DiseaseResult, ChatMessage

logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def _load_images(frame_paths: List[str]) -> List[Image.Image]:
    """Load local image files as PIL Images for the Gemini SDK."""
    return [Image.open(p) for p in frame_paths]


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
You are an expert livestock nutritionist and veterinary professional specialising in
cattle body condition scoring (BCS). Analyse the provided cattle images carefully.

IMPORTANT RULES:
- Score on a 1-5 scale (1=emaciated, 3=ideal, 5=obese)
- Be objective; base observations only on what is visibly clear
- If image quality is insufficient, reflect low confidence
- Return ONLY a valid JSON object — no markdown, no explanations

Required JSON format:
{
  "bcs_score": <float 1.0-5.0>,
  "bcs_scale": "1-5",
  "condition": "<descriptive label>",
  "confidence": <float 0.0-1.0>,
  "observations": ["<observation 1>", "..."],
  "recommendations": ["<recommendation 1>", "..."]
}
"""

DISEASE_SYSTEM_PROMPT = """\
You are an experienced veterinary professional performing a visual cattle health screening.
Analyse the provided images for any visible signs of health concerns.

IMPORTANT RULES:
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


MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-flash"]



async def _generate_content_with_fallback(
    client: genai.Client,
    contents: list,
    system_instruction: str,
    temperature: float = 0.2,
    max_output_tokens: int = 1024,
) -> str:
    """Try multiple Gemini model variants to handle rate limits / 429 quota issues."""
    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            logger.info(f"Attempting Gemini generation with model: {model_name}")
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )
            if response.text:
                return _strip_fences(response.text)
        except Exception as exc:
            logger.warning(f"Gemini model {model_name} failed: [{type(exc).__name__}] {exc}")
            last_error = exc
            if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc) or "quota" in str(exc).lower():
                continue
            # If it's a non-429 error, still try fallback models before raising
            continue

    raise RuntimeError(
        f"AI analysis temporarily unavailable due to API rate limits/quota exhaustion. "
        f"Details: {last_error}"
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def analyse_bcs(frame_paths: List[str]) -> BCSResult:
    """Send selected frames to Gemini and return a validated BCSResult."""
    client = _get_client()
    images = _load_images(frame_paths)

    contents: list = [
        "Please analyse these cattle images and provide a BCS assessment in the required JSON format.",
        *images,
    ]

    raw = await _generate_content_with_fallback(
        client=client,
        contents=contents,
        system_instruction=BCS_SYSTEM_PROMPT,
        temperature=0.2,
        max_output_tokens=1024,
    )
    logger.debug(f"BCS raw response: {raw}")
    data = json.loads(raw)
    data["bcs_score"] = float(data.get("bcs_score", 3.0))
    data["confidence"] = float(data.get("confidence", 0.9))
    return BCSResult(**data)


async def analyse_disease(frame_paths: List[str]) -> DiseaseResult:
    """Send selected frames to Gemini and return a validated DiseaseResult."""
    client = _get_client()
    images = _load_images(frame_paths)

    contents: list = [
        "Please perform a visual health screening on these cattle images and return results in the required JSON format.",
        *images,
    ]

    raw = await _generate_content_with_fallback(
        client=client,
        contents=contents,
        system_instruction=DISEASE_SYSTEM_PROMPT,
        temperature=0.2,
        max_output_tokens=1024,
    )
    logger.debug(f"Disease raw response: {raw}")
    data = json.loads(raw)
    data["confidence"] = float(data.get("confidence", 0.85))
    return DiseaseResult(**data)



async def chat(
    message: str,
    history: List[ChatMessage],
    analysis_context: Optional[Any] = None,
    analysis_type: Optional[str] = None,
) -> str:
    """Answer a cattle health question using stored analysis context."""
    client = _get_client()

    system_content = CHAT_SYSTEM_PROMPT
    if analysis_context:
        context_str = json.dumps(analysis_context, indent=2)
        analysis_label = "BCS Analysis" if analysis_type == "bcs" else "Disease Screening"
        system_content += (
            f"\n\n## Current {analysis_label} Context\n```json\n{context_str}\n```\n"
            "Refer to this when the user asks about their cattle's condition."
        )

    # Build conversation turns
    contents = []
    for h in history[-10:]:
        role = "user" if h.role.value == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=h.message)]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    return await _generate_content_with_fallback(
        client=client,
        contents=contents,
        system_instruction=system_content,
        temperature=0.4,
        max_output_tokens=600,
    )

