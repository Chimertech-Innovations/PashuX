"""
Router: AI chatbot
POST /api/chat
Uses stored analysis context — does NOT re-send video frames.
"""

import logging
from fastapi import APIRouter, HTTPException, status

import services.image_analysis as ai
import services.supabase_service as db
from models.schemas import ChatRequest, ChatResponse


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest):
    if not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    # Fetch fresh analysis context from DB if not provided
    context = body.analysis_context
    if context is None and body.request_id:
        try:
            result_record = await db.get_analysis_result(body.request_id)
            if result_record:
                context = result_record.get("result_json")
        except Exception as exc:
            logger.warning(f"Could not fetch analysis context: {exc}")

    # Get AI reply
    try:
        reply = await ai.chat(
            message=body.message,
            history=body.history or [],
            analysis_context=context,
            analysis_type=body.analysis_type.value if body.analysis_type else None,
        )
    except Exception as exc:
        logger.exception("Chat failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat service temporarily unavailable.",
        )

    # Persist messages
    try:
        await db.save_chat_message(body.user_id, body.request_id, "user", body.message)
        await db.save_chat_message(body.user_id, body.request_id, "assistant", reply)
    except Exception as exc:
        logger.warning(f"Chat message persist failed: {exc}")

    # Very simple product recommendation extraction from reply
    product_keywords = {
        "cmt kit": "cmt-kit",
        "quadmastest": "quadmastest",
        "finekine": "finekine",
        "iogiene": "iogiene",
        "moofoam": "moofoam",
        "tic-tick-tic": "tic-tick-tic",
        "mbrt": "mbrt-test",
        "resazurin": "resazurin-test",
        "bcp": "bcp-test",
        "boostbcs": "cattle-supplement",
        "pregnancy": "pregnancy-kit",
    }
    mentioned_products = [
        pid for kw, pid in product_keywords.items()
        if kw.lower() in reply.lower()
    ]

    return ChatResponse(reply=reply, product_recommendations=mentioned_products)
