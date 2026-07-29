"""
Router: AI analysis (BCS + Disease)
POST /api/analyse-bcs
POST /api/analyse-disease
"""

import logging
from fastapi import APIRouter, HTTPException, status

from models.schemas import AnalyseRequest, AnalysisResultResponse
import services.image_analysis as ai
import services.supabase_service as db
from services.video_processor import cleanup


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyse-bcs")
async def analyse_bcs(body: AnalyseRequest):
    if not body.frame_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No frame paths provided.",
        )

    # Verify frames exist locally
    missing = [p for p in body.frame_paths if not __import__("os").path.exists(p)]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{len(missing)} frame file(s) not found on server.",
        )

    try:
        result = await ai.analyse_bcs(body.frame_paths)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("BCS analysis failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI analysis failed. Please try again.")

    # Save result to DB
    try:
        await db.save_analysis_result(
            request_id=body.request_id,
            analysis_type="bcs",
            result_json=result.model_dump(),
        )
        await db.update_request_status(body.request_id, "completed")
    except Exception as exc:
        logger.warning(f"DB save failed: {exc}")

    # Cleanup local frames (already uploaded to storage)
    for path in body.frame_paths:
        cleanup(path)

    return {
        "request_id": body.request_id,
        "analysis_type": "bcs",
        "result": result.model_dump(),
    }


@router.post("/analyse-disease")
async def analyse_disease(body: AnalyseRequest):
    if not body.frame_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No frame paths provided.",
        )

    missing = [p for p in body.frame_paths if not __import__("os").path.exists(p)]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{len(missing)} frame file(s) not found on server.",
        )

    try:
        result = await ai.analyse_disease(body.frame_paths)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Disease analysis failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI analysis failed. Please try again.")

    try:
        await db.save_analysis_result(
            request_id=body.request_id,
            analysis_type="disease",
            result_json=result.model_dump(),
        )
        await db.update_request_status(body.request_id, "completed")
    except Exception as exc:
        logger.warning(f"DB save failed: {exc}")

    for path in body.frame_paths:
        cleanup(path)

    return {
        "request_id": body.request_id,
        "analysis_type": "disease",
        "result": result.model_dump(),
    }
