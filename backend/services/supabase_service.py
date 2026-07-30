"""
Supabase service layer — handles all database and storage operations.
Uses the SERVICE ROLE KEY for backend-side privileged access.
"""

import os
import logging
import uuid
from typing import Optional, Any

from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
        _client = create_client(url, key)
    return _client


# ── Analysis Requests ─────────────────────────────────────────────────────────

async def create_analysis_request(
    user_id: Optional[str],
    analysis_type: str,
    video_path: Optional[str] = None,
) -> dict:
    sb = get_client()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "analysis_type": analysis_type,
        "original_video_url": video_path,
        "processing_status": "pending",
    }
    result = sb.table("analysis_requests").insert(record).execute()
    return result.data[0]


async def update_request_status(request_id: str, status: str) -> None:
    sb = get_client()
    sb.table("analysis_requests").update({"processing_status": status}).eq("id", request_id).execute()


# ── Analysis Results ──────────────────────────────────────────────────────────

async def save_analysis_result(
    request_id: str,
    analysis_type: str,
    result_json: dict,
) -> dict:
    sb = get_client()
    record = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
    }

    if analysis_type == "bcs":
        record["bcs_score"] = result_json.get("bcs_score")
        record["confidence"] = result_json.get("confidence")
        record["observations"] = result_json.get("observations", [])
        record["recommendations"] = result_json.get("recommendations", [])
    else:
        record["possible_condition"] = result_json.get("possible_condition")
        record["confidence"] = result_json.get("confidence")
        record["severity"] = result_json.get("severity")
        record["observations"] = result_json.get("visible_signs", [])
        record["recommendations"] = result_json.get("next_steps", [])

    record["result_json"] = result_json

    result = sb.table("analysis_results").insert(record).execute()
    return result.data[0]


async def get_analysis_result(request_id: str) -> Optional[dict]:
    sb = get_client()
    result = (
        sb.table("analysis_results")
        .select("*")
        .eq("request_id", request_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Selected Frames ───────────────────────────────────────────────────────────

async def save_frame_record(
    request_id: str,
    frame_url: str,
    frame_number: int,
    clarity_score: float,
) -> dict:
    sb = get_client()
    record = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "frame_url": frame_url,
        "frame_number": frame_number,
        "clarity_score": clarity_score,
    }
    result = sb.table("selected_frames").insert(record).execute()
    return result.data[0]


async def get_frames_for_request(request_id: str) -> list:
    sb = get_client()
    result = (
        sb.table("selected_frames")
        .select("*")
        .eq("request_id", request_id)
        .order("frame_number")
        .execute()
    )
    return result.data


# ── Storage: Upload frame file ────────────────────────────────────────────────

async def upload_frame_to_storage(
    frame_path: str,
    request_id: str,
    frame_number: Any = 1,
) -> str:
    """
    Upload a frame image to Supabase Storage and return the public URL.
    Bucket name: 'frames'  (must be created in Supabase Dashboard with public=true)
    """
    sb = get_client()
    bucket = "frames"
    if isinstance(frame_number, int):
        storage_path = f"{request_id}/frame_{frame_number:04d}.jpg"
    else:
        fn_str = str(frame_number)
        if fn_str.endswith(".jpg") or fn_str.endswith(".png") or fn_str.endswith(".webp"):
            storage_path = f"{request_id}/{fn_str}"
        else:
            storage_path = f"{request_id}/frame_{fn_str}.jpg"

    with open(frame_path, "rb") as f:
        data = f.read()

    sb.storage.from_(bucket).upload(
        storage_path,
        data,
        {"content-type": "image/jpeg", "upsert": "true"},
    )

    public_url = sb.storage.from_(bucket).get_public_url(storage_path)
    return public_url



async def upload_video_to_storage(
    video_path: str,
    request_id: str,
    ext: str = ".mp4",
) -> str:
    """
    Upload the original video to Supabase Storage ('videos' bucket, private).
    Returns the storage path (not a public URL since bucket is private).
    Silently returns empty string if the bucket does not exist.
    """
    sb = get_client()
    bucket = "videos"
    storage_path = f"{request_id}/original{ext}"

    try:
        with open(video_path, "rb") as f:
            data = f.read()

        sb.storage.from_(bucket).upload(
            storage_path,
            data,
            {"content-type": "video/mp4", "upsert": "true"},
        )
        public_url = sb.storage.from_(bucket).get_public_url(storage_path)
        logger.info(f"Original video uploaded to storage: {public_url}")
        return public_url
    except Exception as exc:
        logger.warning(
            f"Video upload to 'videos' bucket skipped: [{type(exc).__name__}] {exc}. "
            "Create a 'videos' bucket in Supabase Storage to enable this."
        )
        return ""



# ── Chat Messages ─────────────────────────────────────────────────────────────

async def save_chat_message(
    user_id: Optional[str],
    request_id: Optional[str],
    role: str,
    message: str,
) -> dict:
    sb = get_client()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "request_id": request_id,
        "role": role,
        "message": message,
    }
    result = sb.table("chat_messages").insert(record).execute()
    return result.data[0]


async def get_chat_history(request_id: str) -> list:
    sb = get_client()
    result = (
        sb.table("chat_messages")
        .select("*")
        .eq("request_id", request_id)
        .order("created_at")
        .execute()
    )
    return result.data


# ── Products ──────────────────────────────────────────────────────────────────

async def get_products(category: Optional[str] = None) -> list:
    sb = get_client()
    query = sb.table("products").select("*")
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return result.data


async def get_analysis_history(user_id: str) -> list:
    sb = get_client()
    result = (
        sb.table("analysis_requests")
        .select("*, analysis_results(*), selected_frames(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# ── Admin Functions ────────────────────────────────────────────────────────────

async def get_all_users() -> list:
    sb = get_client()
    try:
        users = sb.table("users").select("*").order("created_at", desc=True).execute().data
    except Exception:
        users = []
    return users


async def get_all_reports() -> list:
    sb = get_client()
    try:
        reqs = sb.table("analysis_requests").select("*").order("created_at", desc=True).execute().data or []
        for req in reqs:
            req_id = req.get("id")
            u_id = req.get("user_id")
            
            # Fetch results
            res_data = sb.table("analysis_results").select("*").eq("request_id", req_id).execute().data or []
            req["analysis_results"] = res_data
            
            # Fetch frames
            frames_data = sb.table("selected_frames").select("*").eq("request_id", req_id).order("frame_number").execute().data or []
            req["selected_frames"] = frames_data

            # Fetch chat messages
            chats_data = sb.table("chat_messages").select("*").eq("request_id", req_id).order("created_at").execute().data or []
            req["chat_messages"] = chats_data

            # Fetch user info
            if u_id:
                try:
                    u_data = sb.table("users").select("full_name, email").eq("id", u_id).limit(1).execute().data
                    if u_data:
                        req["users"] = u_data[0]
                    else:
                        req["users"] = {"full_name": "Registered User", "email": "user@chimertech.ai"}
                except Exception:
                    req["users"] = {"full_name": "Registered User", "email": "user@chimertech.ai"}
            else:
                req["users"] = {"full_name": "Guest User", "email": "guest@chimertech.ai"}
        return reqs
    except Exception as exc:
        logger.warning(f"Error fetching all reports for admin: {exc}")
        return []



async def get_admin_stats() -> dict:
    sb = get_client()
    try:
        users_res = sb.table("users").select("id", count="exact").execute()
        reqs_res  = sb.table("analysis_requests").select("id, analysis_type", count="exact").execute()
        
        reqs = reqs_res.data or []
        total_users = users_res.count or len(sb.table("users").select("id").execute().data or [])
        total_scans = reqs_res.count or len(reqs)
        
        bcs_count = sum(1 for r in reqs if r.get("analysis_type") == "bcs")
        disease_count = sum(1 for r in reqs if r.get("analysis_type") == "disease")
        combined_count = sum(1 for r in reqs if r.get("analysis_type") in ("combined", "live"))
        
        return {
            "total_users": total_users,
            "total_scans": total_scans,
            "bcs_scans": bcs_count,
            "disease_scans": disease_count,
            "live_scans": combined_count,
        }
    except Exception as exc:
        logger.warning(f"Failed to calculate admin stats: {exc}")
        return {
            "total_users": 0,
            "total_scans": 0,
            "bcs_scans": 0,
            "disease_scans": 0,
            "live_scans": 0,
        }

