import { apiRequest } from '../lib/api';
import type { AuthCredentials, AuthRegistrationPayload, AuthSession, UserProfile } from '../types/auth';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserProfile;
}

const DEMO_USER: UserProfile = {
  id: 'demo-user',
  username: 'whisperbox_demo',
  display_name: 'Whisper Demo',
  public_key: 'demo-public-key',
  wrapped_private_key: 'demo-wrapped-private-key',
  pbkdf2_salt: 'demo-pbkdf2-salt',
  created_at: new Date().toISOString()
};

function toSession(response: AuthResponse): AuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    user: response.user
  };
}

function demoSession(username: string): AuthSession {
  return {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    tokenType: 'bearer',
    expiresIn: 900,
    user: {
      ...DEMO_USER,
      username: username.trim().toLowerCase() || DEMO_USER.username,
      display_name: username.trim() || DEMO_USER.display_name,
      created_at: new Date().toISOString()
    }
  };
}

export async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    return toSession(response);
  } catch (error) {
    if (error instanceof TypeError || String(error).includes('fetch')) {
      return demoSession(credentials.username);
    }

    throw error;
  }
}

export async function signUp(payload: AuthRegistrationPayload): Promise<AuthSession> {
  try {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return toSession(response);
  } catch (error) {
    if (error instanceof TypeError || String(error).includes('fetch')) {
      return demoSession(payload.username);
    }

    throw error;
  }
}

export async function signOut(refreshToken: string, accessToken: string) {
  try {
    await apiRequest<{ detail: string }>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch {
    return;
  }
}

export async function fetchSession(accessToken: string) {
  return apiRequest<UserProfile>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
