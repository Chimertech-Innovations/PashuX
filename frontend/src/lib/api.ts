import type {
  UploadResponse,
  ProcessResponse,
  AnalyseResponse,
  CombinedAnalyseResponse,
  Product,
  ChatMessage,
  AnalysisType,
} from '@/types';


/**
 * Dynamic API Base URL resolver:
 * Ensures the app connects reliably to the backend across all environments:
 * 1. Checks localStorage('PASHU_BACKEND_URL') for custom backend address.
 * 2. If running via Vite dev server (port 5173/3000), returns relative path ""
 *    so Vite's proxy automatically routes /api requests to http://localhost:8000.
 *    This allows mobile devices on the same Wi-Fi to work seamlessly.
 * 3. In production HTTPS, respects VITE_API_BASE_URL if configured.
 * 4. Falls back to http://localhost:8000 on desktop localhost.
 */
function resolveBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('PASHU_BACKEND_URL');
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
  }

  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isHttps = protocol === 'https:';

    // When accessing via Vite dev server (e.g. port 5173 / 3000) on laptop or mobile over Wi-Fi:
    // Return relative path "" so Vite's proxy automatically routes /api requests to http://localhost:8000!
    if (port === '5173' || port === '3000' || port === '5174') {
      return '';
    }

    // In production on HTTPS (e.g. Vercel deployment):
    if (isHttps) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.startsWith('http:')) {
        return envUrl.replace(/\/+$/, '');
      }
      return '';
    }

    // If accessing via local IP over HTTP:
    if (!isLocalhost) {
      return `http://${hostname}:8000`;
    }
  }

  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
}

export const BASE_URL = resolveBaseUrl();


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

export async function analyseCombined(
  requestId: string,
  framePaths: string[],
  userId?: string
): Promise<CombinedAnalyseResponse> {
  return request<CombinedAnalyseResponse>('/api/analyse-combined', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: requestId,
      analysis_type: 'combined',
      frame_paths: framePaths,
      user_id: userId,
    }),
  });
}

export async function analyseInstantLive(
  file: File,
  userId?: string
): Promise<CombinedAnalyseResponse & { frame_urls?: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) formData.append('user_id', userId);

  return request('/api/analyse-instant-live', {
    method: 'POST',
    body: formData,
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
  language?: string;
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
