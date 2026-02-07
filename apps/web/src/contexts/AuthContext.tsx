"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, setAccessToken, type UserResponse } from "@/lib/api";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // マウント時にセッション復元
  useEffect(() => {
    const restoreSession = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await api.refresh(refreshToken);
        setAccessToken(tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        const me = await api.getMe();
        setUser(me);
      } catch {
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAccessToken(res.tokens.accessToken);
    localStorage.setItem("refreshToken", res.tokens.refreshToken);
    setUser({
      id: res.user.id,
      email: res.user.email,
      displayName: res.user.displayName,
      avatarUrl: null,
      createdAt: "",
    });
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await api.register({ email, password, displayName });
    setAccessToken(res.tokens.accessToken);
    localStorage.setItem("refreshToken", res.tokens.refreshToken);
    setUser({
      id: res.user.id,
      email: res.user.email,
      displayName: res.user.displayName,
      avatarUrl: null,
      createdAt: "",
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    } finally {
      setAccessToken(null);
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth は AuthProvider 内で使用してください");
  }
  return context;
}
