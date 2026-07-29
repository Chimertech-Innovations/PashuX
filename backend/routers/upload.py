"""
Router: video upload
POST /api/upload-video
"""

import os
import uuid
import logging
import tempfile

import aiofiles
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse

from models.schemas import UploadResponse
import services.supabase_service as db

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_VIDEO_SIZE_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", "50"))
MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_TYPES = ALLOWED_VIDEO_TYPES | ALLOWED_IMAGE_TYPES


@router.post("/upload-video", response_model=UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    analysis_type: str = Form(...),
    user_id: str = Form(None),
):
    # Determine if photo or video
    content_type = (file.content_type or "").lower()
    filename_lower = (file.filename or "").lower()

    is_image = (
        content_type in ALLOWED_IMAGE_TYPES
        or any(filename_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])
    )
    is_video = (
        content_type in ALLOWED_VIDEO_TYPES
        or any(filename_lower.endswith(ext) for ext in [".mp4", ".mov", ".avi"])
    )

    if not (is_image or is_video):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Please upload MP4/MOV videos or JPG/PNG photos.",
        )

    # Read and check size
    content = await file.read()
    max_size = 15 * 1024 * 1024 if is_image else MAX_VIDEO_SIZE_BYTES
    if len(content) > max_size:
        size_label = "15MB" if is_image else f"{MAX_VIDEO_SIZE_MB}MB"
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {size_label}.",
        )

    # Save to temp directory
    request_id = str(uuid.uuid4())
    work_dir = os.path.join(tempfile.gettempdir(), "chimertech", request_id)
    os.makedirs(work_dir, exist_ok=True)

    default_ext = ".jpg" if is_image else ".mp4"
    ext = os.path.splitext(file.filename or f"media{default_ext}")[1] or default_ext
    media_path = os.path.join(work_dir, f"media{ext}")

    async with aiofiles.open(media_path, "wb") as f:
        await f.write(content)

    # Attempt to upload original video/image to Supabase Storage (best-effort)
    video_storage_path = await db.upload_video_to_storage(media_path, request_id, ext)

    # Create DB record — use storage path as original_video_url if available
    try:
        record = await db.create_analysis_request(
            user_id=user_id,
            analysis_type=analysis_type,
            video_path=video_storage_path or media_path,
        )
        request_id = record["id"]
    except Exception as exc:
        logger.warning(f"DB unavailable, using local request_id: {exc}")

    return UploadResponse(
        request_id=request_id,
        video_path=media_path,
        message="Media uploaded successfully. Ready for processing.",
    )

