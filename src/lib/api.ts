import type { AuthResponse, User, UserSearchResult, Message, Conversation, MessagePayload } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://whisperbox.koyeb.app';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      message = err.detail || err.message || message;
    } catch { /* ignore */ }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const authApi = {
  register: (data: {
    username: string; display_name: string; password: string;
    public_key: string; wrapped_private_key: string; pbkdf2_salt: string;
  }): Promise<AuthResponse> =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (username: string, password: string): Promise<AuthResponse> =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  me: (token: string): Promise<User> =>
    request('/auth/me', {}, token),

  refresh: (refresh_token: string): Promise<{ access_token: string; token_type: string; expires_in: number }> =>
    request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),

  logout: (token: string, refresh_token: string): Promise<{ detail: string }> =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }, token),
};

export const usersApi = {
  search: (q: string, token: string): Promise<UserSearchResult[]> =>
    request(`/users/search?q=${encodeURIComponent(q)}`, {}, token),

  getPublicKey: (userId: string, token: string): Promise<{ public_key: string }> =>
    request(`/users/${userId}/public-key`, {}, token),
};

export const messagesApi = {
  getConversations: (token: string): Promise<Conversation[]> =>
    request('/conversations', {}, token),

  getMessages: (userId: string, token: string, limit = 50, before?: string): Promise<Message[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return request(`/conversations/${userId}/messages?${params}`, {}, token);
  },

  sendMessage: (to: string, payload: MessagePayload, token: string): Promise<Message> =>
    request('/messages', { method: 'POST', body: JSON.stringify({ to, payload }) }, token),
};
