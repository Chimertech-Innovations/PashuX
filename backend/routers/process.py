"""
Router: video processing pipeline
POST /api/process-video
"""

import os
import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from services.video_processor import process_video, process_image
from services.supabase_service import update_request_status, upload_frame_to_storage, save_frame_record
from models.schemas import ProcessResponse

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_VIDEO_DURATION_SECONDS = int(os.getenv("MAX_VIDEO_DURATION_SECONDS", "60"))


class ProcessRequest(BaseModel):
    request_id: str
    video_path: str
    user_id: Optional[str] = None


@router.post("/process-video", response_model=ProcessResponse)
async def process_video_route(body: ProcessRequest):
    if not os.path.exists(body.video_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found. Please re-upload.",
        )

    work_dir = os.path.dirname(body.video_path)
    ext = os.path.splitext(body.video_path)[1].lower()
    is_image = ext in [".jpg", ".jpeg", ".png", ".webp"]

    if not is_image:
        # Validate video duration with OpenCV
        import cv2
        cap = cv2.VideoCapture(body.video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        duration = total_frames / fps if fps > 0 else 0

        if duration > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video is too long ({duration:.0f}s). Maximum allowed duration is {MAX_VIDEO_DURATION_SECONDS} seconds.",
            )

    # Update status
    try:
        await update_request_status(body.request_id, "processing")
    except Exception:
        pass

    # Run processing pipeline (video or photo)
    try:
        if is_image:
            result = process_image(body.video_path, work_dir)
        else:
            result = process_video(body.video_path, work_dir)
    except ValueError as exc:
        try:
            await update_request_status(body.request_id, "failed")
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Media processing failed")
        try:
            await update_request_status(body.request_id, "failed")
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Media processing failed.")


    # Upload selected frames to Supabase Storage
    frame_urls: list[str] = []
    for fd in result["frame_data"]:
        try:
            url = await upload_frame_to_storage(
                fd["path"], body.request_id, fd["frame_number"]
            )
            await save_frame_record(
                request_id=body.request_id,
                frame_url=url,
                frame_number=fd["frame_number"],
                clarity_score=fd["clarity_score"],
            )
            frame_urls.append(url)
        except Exception as exc:
            logger.warning(
                f"Frame upload to Supabase Storage failed for frame {fd['frame_number']}: "
                f"[{type(exc).__name__}] {exc}. "
                "Check that the 'frames' bucket exists (public=true) and SUPABASE_SERVICE_ROLE_KEY is a valid JWT."
            )
            # Fall back: no public URL for this frame
            frame_urls.append("")

    return ProcessResponse(
        request_id=body.request_id,
        frames_extracted=result["frames_extracted"],
        frames_after_blur_filter=result["frames_after_blur_filter"],
        frames_after_dedup=result["frames_after_dedup"],
        top_frames_selected=result["top_frames_selected"],
        frame_paths=[fd["path"] for fd in result["frame_data"]],
        frame_urls=frame_urls,
        clarity_scores=[fd["clarity_score"] for fd in result["frame_data"]],
    )
