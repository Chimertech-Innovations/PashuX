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
 * 1. If VITE_API_BASE_URL is set and points to an external server (e.g. Railway/Render), use it.
 * 2. If running on HTTPS (production Vercel, Netlify, custom domain, mobile browser),
 *    never call http://localhost (which causes Mixed Content blocks and fails on mobile phones).
 *    Instead, use the production backend URL: https://pashux-production.up.railway.app
 * 3. If running on a local network IP (e.g. testing mobile phone over Wi-Fi on http://192.168.x.x:5173),
 *    dynamically route to http://<current-ip>:8000 so the mobile phone talks to the host PC backend.
 * 4. Only use http://localhost:8000 when literally running on desktop localhost.
 */
function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isHttps = protocol === 'https:';
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    // If site is served over HTTPS (production domain, mobile Safari/Chrome, Vercel):
    if (isHttps) {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1') || envUrl.startsWith('http:')) {
        return 'https://pashux-production.up.railway.app';
      }
      return envUrl.replace(/\/+$/, '');
    }

    // If accessing from mobile device over local Wi-Fi (e.g. http://192.168.1.5:5173):
    if (isIPv4 && !isLocalhost) {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return `http://${hostname}:8000`;
      }
    }

    // If on a remote non-localhost domain served over HTTP
    if (!isLocalhost && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'https://pashux-production.up.railway.app';
    }
  }

  if (envUrl) {
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
