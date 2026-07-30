"""
Router: Admin Dashboard API
GET /api/admin/stats
GET /api/admin/users
GET /api/admin/reports
"""

import logging
from fastapi import APIRouter, HTTPException, status
import services.supabase_service as db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_admin_stats():
    try:
        stats = await db.get_admin_stats()
        return stats
    except Exception as exc:
        logger.exception("Failed to retrieve admin stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin dashboard stats.",
        )


@router.get("/users")
async def get_admin_users():
    try:
        users = await db.get_all_users()
        return {"users": users}
    except Exception as exc:
        logger.exception("Failed to retrieve admin user list")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users.",
        )


@router.get("/reports")
async def get_admin_reports():
    try:
        reports = await db.get_all_reports()
        return {"reports": reports}
    except Exception as exc:
        logger.exception("Failed to retrieve admin reports")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve health reports.",
        )
