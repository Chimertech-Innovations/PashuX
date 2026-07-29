"""
Chimertech FastAPI backend — main entry point
"""

import logging
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routers import upload, process, analyse, chat, products, results

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Rate limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Chimertech Cattle Health API",
    description="AI-powered cattle BCS scoring and disease detection backend.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(upload.router,   prefix="/api", tags=["Upload"])
app.include_router(process.router,  prefix="/api", tags=["Processing"])
app.include_router(analyse.router,  prefix="/api", tags=["Analysis"])
app.include_router(chat.router,     prefix="/api", tags=["Chat"])
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(results.router,  prefix="/api", tags=["Results"])

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "Chimertech Cattle Health API"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to the Chimertech Cattle Health API",
        "docs": "/docs",
        "version": "1.0.0",
    }
