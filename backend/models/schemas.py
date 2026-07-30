from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum


class AnalysisType(str, Enum):
    bcs = "bcs"
    disease = "disease"
    combined = "combined"



class ProcessingStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# ── BCS ──────────────────────────────────────────────────────────────────────

class BCSResult(BaseModel):
    bcs_score: float = Field(..., ge=0.0, le=5.0)
    bcs_scale: str = "1-5"
    condition: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    observations: List[str]
    recommendations: List[str]


# ── Disease ───────────────────────────────────────────────────────────────────

class DiseaseResult(BaseModel):
    possible_condition: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: str
    visible_signs: List[str]
    affected_area: str
    urgency: str
    next_steps: List[str]


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    role: ChatMessageRole
    message: str


class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    analysis_type: Optional[AnalysisType] = None
    analysis_context: Optional[Any] = None
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    product_recommendations: Optional[List[str]] = []


# ── Upload / Process ──────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    request_id: str
    video_path: str
    message: str


class ProcessResponse(BaseModel):
    request_id: str
    frames_extracted: int
    frames_after_blur_filter: int
    frames_after_dedup: int
    top_frames_selected: int
    frame_paths: List[str]
    frame_urls: Optional[List[str]] = []
    clarity_scores: Optional[List[float]] = []


class AnalyseRequest(BaseModel):
    request_id: str
    analysis_type: AnalysisType
    frame_paths: List[str]
    user_id: Optional[str] = None


class CombinedAnalyseRequest(BaseModel):
    request_id: str
    analysis_type: Optional[str] = "combined"
    frame_paths: List[str]
    user_id: Optional[str] = None



class AnalysisResultResponse(BaseModel):
    id: str
    request_id: str
    analysis_type: str
    bcs_result: Optional[BCSResult] = None
    disease_result: Optional[DiseaseResult] = None
    frame_urls: Optional[List[str]] = []
    created_at: Optional[str] = None


# ── Products ──────────────────────────────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    category: str
    description: str
    image_url: str
    price: float
    product_page_url: str
    recommended_for: List[str] = []
