'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthResponse, AuthUser } from '@chat/shared';

import { ApiClientError, authApi, publicApi } from '@/lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (payload: { email: string; password: string }) => Promise<AuthResponse>;
  register: (payload: { username: string; email: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  authedApi: ReturnType<typeof authApi> | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthResponse(
  payload: AuthResponse,
  setUser: (user: AuthUser | null) => void,
  setAccessToken: (token: string | null) => void,
  setStatus: (status: AuthStatus) => void,
) {
  setUser(payload.user);
  setAccessToken(payload.tokens.accessToken);
  setStatus('authenticated');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const isRefreshingRef = useRef<Promise<AuthResponse | null> | null>(null);

  const refreshSession = async () => {
    if (isRefreshingRef.current) {
      return isRefreshingRef.current;
    }

    isRefreshingRef.current = publicApi
      .refresh()
      .then((payload) => {
        applyAuthResponse(payload, setUser, setAccessToken, setStatus);
        return payload;
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
        setStatus('unauthenticated');
        return null;
      })
      .finally(() => {
        isRefreshingRef.current = null;
      });

    return isRefreshingRef.current;
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      async login(payload) {
        const result = await publicApi.login(payload);
        applyAuthResponse(result, setUser, setAccessToken, setStatus);
        return result;
      },
      async register(payload) {
        const result = await publicApi.register(payload);
        applyAuthResponse(result, setUser, setAccessToken, setStatus);
        return result;
      },
      async logout() {
        await publicApi.logout();
        setUser(null);
        setAccessToken(null);
        setStatus('unauthenticated');
      },
      refreshSession,
      authedApi: accessToken ? authApi(accessToken) : null,
    }),
    [accessToken, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}

export async function withTokenRefresh<T>(
  execute: () => Promise<T>,
  refresh: () => Promise<AuthResponse | null>,
) {
  try {
    return await execute();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      const refreshed = await refresh();

      if (refreshed) {
        return execute();
      }
    }

    throw error;
  }
}
