import {
  createContext, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import type { AuthContextType, User } from '../types';
import { authApi } from '../lib/api';
import { generateAndWrapKeyPair, unwrapPrivateKey } from '../lib/crypto';

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY   = 'wb_access_token';
const REFRESH_KEY = 'wb_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null);
  const [accessToken, setAccess]    = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefresh]  = useState<string | null>(() => localStorage.getItem(REFRESH_KEY));
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  // True when token is valid but private key not yet in memory (page reload case)
  const [needsUnlock, setNeedsUnlock] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistTokens = (access: string, refresh: string, expiresIn = 900) => {
    sessionStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setAccess(access);
    setRefresh(refresh);
    scheduleRefresh(access, refresh, expiresIn);
  };

  const clearTokens = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccess(null);
    setRefresh(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const scheduleRefresh = (access: string, refresh: string, expiresIn: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = Math.max((expiresIn - 60) * 1000, 0);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await authApi.refresh(refresh);
        sessionStorage.setItem(TOKEN_KEY, data.access_token);
        setAccess(data.access_token);
        scheduleRefresh(data.access_token, refresh, data.expires_in);
      } catch {
        clearTokens();
        setUser(null);
        setPrivateKey(null);
        setNeedsUnlock(false);
      }
    }, delay);
  };

  // Restore session on mount — token survives page reload, private key does not
  useEffect(() => {
    const restore = async () => {
      const access  = sessionStorage.getItem(TOKEN_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!access || !refresh) { setIsLoading(false); return; }
      try {
        const userData = await authApi.me(access);
        setUser(userData);
        setAccess(access);
        scheduleRefresh(access, refresh, 900);
        // Private key is gone after reload — user must enter password to unlock
        setNeedsUnlock(true);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Unlock: re-derive private key from password without full re-login
  const unlockSession = async (password: string) => {
    if (!user) throw new Error('No user session');
    const privKey = await unwrapPrivateKey(
      user.wrapped_private_key,
      user.pbkdf2_salt,
      password
    );
    setPrivateKey(privKey);
    setNeedsUnlock(false);
  };

  const register = async (username: string, displayName: string, password: string) => {
    const { publicKeyBase64, wrappedPrivateKeyBase64, pbkdf2SaltBase64 } =
      await generateAndWrapKeyPair(password);
    const res = await authApi.register({
      username, display_name: displayName, password,
      public_key: publicKeyBase64,
      wrapped_private_key: wrappedPrivateKeyBase64,
      pbkdf2_salt: pbkdf2SaltBase64,
    });
    const privKey = await unwrapPrivateKey(res.user.wrapped_private_key, res.user.pbkdf2_salt, password);
    setUser(res.user);
    setPrivateKey(privKey);
    setNeedsUnlock(false);
    persistTokens(res.access_token, res.refresh_token, res.expires_in);
  };

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    const privKey = await unwrapPrivateKey(res.user.wrapped_private_key, res.user.pbkdf2_salt, password);
    setUser(res.user);
    setPrivateKey(privKey);
    setNeedsUnlock(false);
    persistTokens(res.access_token, res.refresh_token, res.expires_in);
  };

  const logout = async () => {
    try {
      if (accessToken && refreshToken) await authApi.logout(accessToken, refreshToken);
    } catch { /* ignore */ } finally {
      clearTokens();
      setUser(null);
      setPrivateKey(null);
      setNeedsUnlock(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, accessToken, refreshToken, privateKey,
      isLoading, isAuthenticated: !!user && !!accessToken,
      needsUnlock, login, register, logout, unlockSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
