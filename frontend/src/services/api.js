// API client for the FastAPI backend.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const API_TIMEOUT = 300000; // document OCR + AI analysis can take longer than a normal API call

const SESSION_KEY = 'ldi_session';

export function getAuthToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
}

export function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(method, path, { body, isForm } = {}) {
  const url = buildUrl(path);
  const headers = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data !== null && (data.detail || data.message)) ||
        (typeof data === 'string' && data) ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The document took too long to process. Please try a smaller PDF or try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Unable to reach the backend. Make sure FastAPI is running on the configured API URL.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
