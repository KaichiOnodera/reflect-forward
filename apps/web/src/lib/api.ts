const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// トークン管理（メモリ上）
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// リフレッシュの重複リクエスト防止
let refreshPromise: Promise<RefreshResponse> | null = null;

async function refreshAccessToken(): Promise<RefreshResponse> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new ApiError(401, "リフレッシュトークンがありません");
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || "セッションの更新に失敗しました");
  }

  return res.json();
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 401 の場合、リフレッシュトークンで再試行
  if (res.status === 401 && localStorage.getItem("refreshToken")) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }
      const tokens = await refreshPromise;
      refreshPromise = null;

      setAccessToken(tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      headers["Authorization"] = `Bearer ${tokens.accessToken}`;
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } catch {
      refreshPromise = null;
      throw new ApiError(401, "認証の有効期限が切れました");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || "エラーが発生しました");
  }

  return res.json();
}

// レスポンス型
export interface AuthResponse {
  user: { id: string; email: string; displayName: string | null };
  tokens: { accessToken: string; refreshToken: string };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// API メソッド
export const api = {
  register(data: { email: string; password: string; displayName?: string }) {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  refresh(refreshToken: string) {
    return apiFetch<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiFetch<{ message: string }>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMe() {
    return apiFetch<UserResponse>("/api/auth/me", {
      method: "GET",
    });
  },
};
