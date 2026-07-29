// ── BCS ──────────────────────────────────────────────────────────────────────

export interface BCSResult {
  bcs_score: number;
  bcs_scale: string;
  condition: string;
  confidence: number;
  observations: string[];
  recommendations: string[];
}

// ── Disease ───────────────────────────────────────────────────────────────────

export interface DiseaseResult {
  possible_condition: string;
  confidence: number;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  visible_signs: string[];
  affected_area: string;
  urgency: string;
  next_steps: string[];
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export type AnalysisType = 'bcs' | 'disease';

export type ProcessingStatus = 'idle' | 'uploading' | 'extracting' | 'filtering_blur' |
  'removing_duplicates' | 'ranking' | 'frames_ready' | 'sending_ai' | 'analysing' | 'completed' | 'error';

export interface ProcessingStep {
  id: ProcessingStatus;
  label: string;
  description: string;
}

export interface AnalysisState {
  requestId: string | null;
  status: ProcessingStatus;
  framePaths: string[];
  frameUrls: string[];
  clarityScores: number[];
  processStats: {
    framesExtracted: number;
    framesAfterBlur: number;
    framesAfterDedup: number;
    topFrames: number;
  } | null;
  bcsResult: BCSResult | null;
  diseaseResult: DiseaseResult | null;
  error: string | null;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  price: number;
  product_page_url: string;
  recommended_for: string[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface UploadResponse {
  request_id: string;
  video_path: string;
  message: string;
}

export interface ProcessResponse {
  request_id: string;
  frames_extracted: number;
  frames_after_blur_filter: number;
  frames_after_dedup: number;
  top_frames_selected: number;
  frame_paths: string[];
  frame_urls: string[];
  clarity_scores: number[];
}

export interface AnalyseResponse {
  request_id: string;
  analysis_type: AnalysisType;
  result: BCSResult | DiseaseResult;
}
