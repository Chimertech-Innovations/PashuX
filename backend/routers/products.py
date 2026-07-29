"""
Router: products
GET /api/products
"""

import json
import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query

import services.supabase_service as db

router = APIRouter()
logger = logging.getLogger(__name__)

PRODUCTS_JSON = Path(__file__).parent.parent / "data" / "products.json"


def _load_local_products():
    with open(PRODUCTS_JSON) as f:
        return json.load(f)


@router.get("/products")
async def get_products(category: Optional[str] = Query(None)):
    # Try Supabase first, fall back to local JSON
    try:
        products = await db.get_products(category=category)
        if products:
            return {"products": products}
    except Exception as exc:
        logger.warning(f"Supabase products fetch failed, using local JSON: {exc}")

    products = _load_local_products()
    if category:
        products = [p for p in products if p.get("category") == category]
    return {"products": products}


@router.get("/products/{product_id}")
async def get_product(product_id: str):
    products = _load_local_products()
    product = next((p for p in products if p["id"] == product_id), None)
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return product
