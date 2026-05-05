import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSession, signIn, signOut, signUp } from '../services/authService';
import type { AuthCredentials, AuthRegistrationPayload, AuthSession, UserProfile } from '../types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isWorking: boolean;
  signInUser: (credentials: AuthCredentials) => Promise<void>;
  signUpUser: (payload: AuthRegistrationPayload) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'whisperbox.session';

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    const storedSession = readStoredSession();

    if (!storedSession) {
      setIsBootstrapping(false);
      return;
    }

    setSession(storedSession);

    fetchSession(storedSession.accessToken)
      .then((user) => {
        setSession((current) =>
          current
            ? {
                ...current,
                user
              }
            : current
        );
      })
      .catch(() => {
        setSession(null);
        persistSession(null);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  const handleSubmit = async (
    request: () => Promise<AuthSession>
  ) => {
    setIsWorking(true);
    try {
      const nextSession = await request();
      setSession(nextSession);
    } finally {
      setIsWorking(false);
      setIsBootstrapping(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session),
      isBootstrapping,
      isWorking,
      signInUser: async (credentials) => {
        await handleSubmit(() => signIn(credentials));
      },
      signUpUser: async (payload) => {
        await handleSubmit(() => signUp(payload));
      },
      signOutUser: async () => {
        if (session) {
          await signOut(session.refreshToken, session.accessToken);
        }
        setSession(null);
        persistSession(null);
      }
    }),
    [isBootstrapping, isWorking, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
