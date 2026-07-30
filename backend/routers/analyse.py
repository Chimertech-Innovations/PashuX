"""
Router: AI analysis (BCS + Disease)
POST /api/analyse-bcs
POST /api/analyse-disease
"""

import os
import logging
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from models.schemas import AnalyseRequest, CombinedAnalyseRequest, AnalysisResultResponse
import services.image_analysis as ai
import services.supabase_service as db
from services.video_processor import cleanup, process_video, process_image




router = APIRouter()
logger = logging.getLogger(__name__)


async def _resolve_frame_paths(request_id: str, frame_paths: list[str]) -> list[str]:
    import os, tempfile, httpx
    valid_paths = [p for p in frame_paths if os.path.exists(p)]
    if valid_paths:
        return valid_paths

    # Local frames missing on server instance — download from Supabase Storage
    logger.info(f"Local frame files missing for request {request_id}. Downloading from Supabase Storage...")
    try:
        frames_db = await db.get_frames_for_request(request_id)
        if frames_db:
            temp_dir = tempfile.mkdtemp(prefix=f"bcs_frames_{request_id}_")
            async with httpx.AsyncClient(timeout=20.0) as client:
                for idx, record in enumerate(frames_db):
                    url = record.get("frame_url")
                    if url:
                        res = await client.get(url)
                        if res.status_code == 200:
                            fpath = os.path.join(temp_dir, f"frame_{idx+1:04d}.jpg")
                            with open(fpath, "wb") as f:
                                f.write(res.content)
                            valid_paths.append(fpath)
    except Exception as exc:
        logger.warning(f"Could not download frames from Supabase: {exc}")

    return valid_paths


@router.post("/analyse-bcs")
async def analyse_bcs(body: AnalyseRequest):
    if not body.frame_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No frame paths provided.",
        )

    resolved_paths = await _resolve_frame_paths(body.request_id, body.frame_paths)
    if not resolved_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frame files not found on server or storage.",
        )

    try:
        result = await ai.analyse_bcs(resolved_paths)
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

    # Cleanup local frames
    for path in resolved_paths:
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

    resolved_paths = await _resolve_frame_paths(body.request_id, body.frame_paths)
    if not resolved_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frame files not found on server or storage.",
        )

    try:
        result = await ai.analyse_disease(resolved_paths)
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

    for path in resolved_paths:
        cleanup(path)

    return {
        "request_id": body.request_id,
        "analysis_type": "disease",
        "result": result.model_dump(),
    }


@router.post("/analyse-combined")
async def analyse_combined(body: CombinedAnalyseRequest):
    if not body.frame_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No frame paths provided.",
        )

    resolved_paths = await _resolve_frame_paths(body.request_id, body.frame_paths)
    if not resolved_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frame files not found on server or storage.",
        )

    try:
        bcs_task = ai.analyse_bcs(resolved_paths)
        disease_task = ai.analyse_disease(resolved_paths)
        bcs_result, disease_result = await asyncio.gather(bcs_task, disease_task)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Combined analysis failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI combined analysis failed. Please try again.")

    try:
        await db.save_analysis_result(
            request_id=body.request_id,
            analysis_type="bcs",
            result_json=bcs_result.model_dump(),
        )
        await db.save_analysis_result(
            request_id=body.request_id,
            analysis_type="disease",
            result_json=disease_result.model_dump(),
        )
        await db.update_request_status(body.request_id, "completed")
    except Exception as exc:
        logger.warning(f"DB save failed: {exc}")

    for path in resolved_paths:
        cleanup(path)

    return {
        "request_id": body.request_id,
        "analysis_type": "combined",
        "bcs_result": bcs_result.model_dump(),
        "disease_result": disease_result.model_dump(),
    }


@router.post("/analyse-instant-live")
async def analyse_instant_live(
    file: UploadFile = File(...),
    user_id: str = Form(None),
):
    """
    Single-step live camera analysis endpoint.
    Accepts live snapshot image or 10s video clip, cleans frames,
    and runs concurrent BCS scoring & Disease screening in ONE call.
    """
    import uuid, tempfile, aiofiles

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded.")

    request_id = str(uuid.uuid4())
    work_dir = os.path.join(tempfile.gettempdir(), "chimertech_live", request_id)
    os.makedirs(work_dir, exist_ok=True)

    filename_lower = (file.filename or "").lower()
    is_image = (
        (file.content_type or "").startswith("image/")
        or any(filename_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])
    )

    default_ext = ".jpg" if is_image else ".webm"
    ext = os.path.splitext(file.filename or f"live_input{default_ext}")[1] or default_ext
    media_path = os.path.join(work_dir, f"live_input{ext}")

    async with aiofiles.open(media_path, "wb") as f:
        await f.write(content)

    try:
        if is_image:
            processed = process_image(media_path, work_dir)
        else:
            processed = process_video(media_path, work_dir)

        frame_paths = [item["path"] for item in processed.get("frame_data", [])]
        if not frame_paths:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No readable cattle frames found in live camera capture.")

        bcs_task = ai.analyse_bcs(frame_paths)
        disease_task = ai.analyse_disease(frame_paths)
        bcs_result, disease_result = await asyncio.gather(bcs_task, disease_task)

        # Storage & DB best effort
        frame_urls = []
        for fpath in frame_paths:
            url = await db.upload_frame_to_storage(fpath, request_id, os.path.basename(fpath))
            if url:
                frame_urls.append(url)

        try:
            req = await db.create_analysis_request(user_id=user_id, analysis_type="combined", video_path=media_path)
            request_id = req.get("id", request_id)
            await db.save_analysis_result(request_id=request_id, analysis_type="bcs", result_json=bcs_result.model_dump())
            await db.save_analysis_result(request_id=request_id, analysis_type="disease", result_json=disease_result.model_dump())
            await db.update_request_status(request_id, "completed")
        except Exception as exc:
            logger.warning(f"DB save failed for instant live analysis: {exc}")

        return {
            "request_id": request_id,
            "analysis_type": "combined",
            "bcs_result": bcs_result.model_dump(),
            "disease_result": disease_result.model_dump(),
            "frame_urls": frame_urls,
        }
    finally:
        cleanup(work_dir)


