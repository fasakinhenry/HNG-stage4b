const FALLBACK_BASE_URL = 'https://whisperbox.koyeb.app';

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || FALLBACK_BASE_URL;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  const contentType = response.headers.get('content-type');
  const body = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'detail' in body ? String(body.detail) : 'Request failed.';
    throw new Error(message);
  }

  return body as T;
}
