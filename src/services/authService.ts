import { apiRequest } from '../lib/api';
import type { AuthCredentials, AuthRegistrationPayload, AuthSession, UserProfile } from '../types/auth';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserProfile;
}

function toSession(response: AuthResponse): AuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    user: response.user
  };
}

export async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  return toSession(response);
}

export async function signUp(payload: AuthRegistrationPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return toSession(response);
}

export async function signOut(refreshToken: string, accessToken: string) {
  await apiRequest<{ detail: string }>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

export async function fetchSession(accessToken: string) {
  return apiRequest<UserProfile>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
