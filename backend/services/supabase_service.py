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


import asyncio
import re

async def upload_muzzle_image(
    image_bytes: bytes,
    cattle_name: str,
) -> str:
    """
    Upload a muzzle image to Supabase Storage and return the public URL.
    Bucket name: 'muzzles' (must be created in Supabase Dashboard with public=true)
    """
    sb = get_client()
    bucket = "muzzles"
    safe_name = re.sub(r'[^A-Za-z0-9]', '_', cattle_name)
    storage_path = f"{uuid.uuid4()}_{safe_name}.jpg"

    def _do_upload():
        sb.storage.from_(bucket).upload(
            storage_path,
            image_bytes,
            {"content-type": "image/jpeg"},
        )
        return sb.storage.from_(bucket).get_public_url(storage_path)

    public_url = await asyncio.to_thread(_do_upload)
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
        users = sb.table("users").select("*").order("created_at", desc=True).execute().data or []
        reqs = sb.table("analysis_requests").select("user_id").execute().data or []
        
        # Count scans per user in-memory (O(N) single pass)
        scan_counts = {}
        for r in reqs:
            uid = r.get("user_id")
            if uid:
                scan_counts[uid] = scan_counts.get(uid, 0) + 1

        for u in users:
            u_id = u.get("id")
            u["total_scans"] = scan_counts.get(u_id, 0)
            if not u.get("full_name") and u.get("email"):
                u["full_name"] = u.get("email").split("@")[0].capitalize()
    except Exception as exc:
        logger.warning(f"Error fetching all users for admin: {exc}")
        users = []
    return users


async def get_all_reports() -> list:
    sb = get_client()
    try:
        # Try 1-query nested relation select first
        try:
            reqs = (
                sb.table("analysis_requests")
                .select("*, analysis_results(*), selected_frames(*), chat_messages(*)")
                .order("created_at", desc=True)
                .execute()
                .data or []
            )
            has_relations = len(reqs) > 0 and ("analysis_results" in reqs[0] or "selected_frames" in reqs[0])
        except Exception:
            reqs = []
            has_relations = False

        # Fallback to 5 bulk queries if nested select fails or lacks relation keys
        if not has_relations:
            reqs = sb.table("analysis_requests").select("*").order("created_at", desc=True).execute().data or []
            if not reqs:
                return []

            # Bulk fetch all child tables in parallel batch
            results_data = sb.table("analysis_results").select("*").execute().data or []
            frames_data  = sb.table("selected_frames").select("*").execute().data or []
            chats_data   = sb.table("chat_messages").select("*").execute().data or []

            # Group by request_id in memory
            results_by_req = {}
            for res in results_data:
                rid = res.get("request_id")
                if rid:
                    results_by_req.setdefault(rid, []).append(res)

            frames_by_req = {}
            for frm in frames_data:
                rid = frm.get("request_id")
                if rid:
                    frames_by_req.setdefault(rid, []).append(frm)

            chats_by_req = {}
            for ch in chats_data:
                rid = ch.get("request_id")
                if rid:
                    chats_by_req.setdefault(rid, []).append(ch)

            for req in reqs:
                rid = req.get("id")
                req["analysis_results"] = results_by_req.get(rid, [])
                req["selected_frames"]  = frames_by_req.get(rid, [])
                req["chat_messages"]    = chats_by_req.get(rid, [])

        # Bulk fetch user profiles for mapping
        users_data = sb.table("users").select("id, full_name, email").execute().data or []
        user_map = {u["id"]: u for u in users_data if u.get("id")}

        for req in reqs:
            u_id = req.get("user_id")
            if u_id and u_id in user_map:
                u_info = user_map[u_id]
                em = u_info.get("email") or "user@chimertech.ai"
                fn = u_info.get("full_name")
                if not fn or fn.strip() == "":
                    fn = em.split("@")[0].capitalize()
                req["users"] = {"full_name": fn, "email": em}
            elif u_id:
                req["users"] = {"full_name": "Registered User", "email": "user@chimertech.ai"}
            else:
                req["users"] = {"full_name": "Guest User", "email": "guest@chimertech.ai"}

            # Ensure frames and chats are sorted
            if req.get("selected_frames"):
                req["selected_frames"].sort(key=lambda x: x.get("frame_number", 0))
            if req.get("chat_messages"):
                req["chat_messages"].sort(key=lambda x: x.get("created_at", ""))

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

