"""
Router: analysis results
GET /api/analysis/{id}
GET /api/analysis/history/{user_id}
"""

import logging
from fastapi import APIRouter, HTTPException, status

import services.supabase_service as db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/analysis/{request_id}")
async def get_analysis(request_id: str):
    try:
        result = await db.get_analysis_result(request_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis result not found.",
            )
        frames = await db.get_frames_for_request(request_id)
        return {
            "result": result,
            "frames": frames,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch analysis result")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve analysis result.",
        )


@router.get("/history/{user_id}")
async def get_history(user_id: str):
    try:
        history = await db.get_analysis_history(user_id)
        return {"history": history}
    except Exception as exc:
        logger.exception("Failed to fetch history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve history.",
        )
