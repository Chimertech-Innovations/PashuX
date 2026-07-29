import type {
  UploadResponse,
  ProcessResponse,
  AnalyseResponse,
  Product,
  ChatMessage,
  AnalysisType,
} from '@/types';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${BASE_URL}${cleanPath}`, {

    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadVideo(
  file: File,
  analysisType: AnalysisType,
  userId?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('analysis_type', analysisType);
  if (userId) formData.append('user_id', userId);

  return request<UploadResponse>('/api/upload-video', {
    method: 'POST',
    body: formData,
  });
}

// ── Process ───────────────────────────────────────────────────────────────────

export async function processVideo(
  requestId: string,
  videoPath: string,
  userId?: string
): Promise<ProcessResponse> {
  return request<ProcessResponse>('/api/process-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, video_path: videoPath, user_id: userId }),
  });
}

// ── Analyse ───────────────────────────────────────────────────────────────────

export async function analyseBCS(
  requestId: string,
  framePaths: string[],
  userId?: string
): Promise<AnalyseResponse> {
  return request<AnalyseResponse>('/api/analyse-bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: requestId,
      analysis_type: 'bcs',
      frame_paths: framePaths,
      user_id: userId,
    }),
  });
}

export async function analyseDisease(
  requestId: string,
  framePaths: string[],
  userId?: string
): Promise<AnalyseResponse> {
  return request<AnalyseResponse>('/api/analyse-disease', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: requestId,
      analysis_type: 'disease',
      frame_paths: framePaths,
      user_id: userId,
    }),
  });
}

// ── Chat ──────────────────────────────────────────────────────────────────────

interface ChatPayload {
  message: string;
  request_id?: string;
  user_id?: string;
  analysis_type?: AnalysisType;
  analysis_context?: unknown;
  history?: { role: string; message: string }[];
}

export async function sendChatMessage(
  payload: ChatPayload
): Promise<{ reply: string; product_recommendations: string[] }> {
  return request('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(category?: string): Promise<Product[]> {
  const url = category ? `/api/products?category=${encodeURIComponent(category)}` : '/api/products';
  const data = await request<{ products: Product[] }>(url);
  return data.products;
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getAnalysis(requestId: string) {
  return request<{ result: unknown; frames: unknown[] }>(`/api/analysis/${requestId}`);
}

export async function getHistory(userId: string) {
  return request<{ history: unknown[] }>(`/api/history/${userId}`);
}
