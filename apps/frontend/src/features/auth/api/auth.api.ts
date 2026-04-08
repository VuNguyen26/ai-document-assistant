import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from "@/lib/auth/token-storage";
import type { ApiEnvelope, LoginPayload, LoginResponse } from "../types/auth.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api/v1";

type RefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      message = errorBody?.message || errorBody?.error || message;
    } catch {
      // ignore
    }

    throw new Error(message);
  }

  const json = (await response.json()) as T | ApiEnvelope<T>;

  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    (json as ApiEnvelope<T>).data !== undefined
  ) {
    return (json as ApiEnvelope<T>).data as T;
  }

  return json as T;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  setAuthSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });

  return result;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const result = await apiFetch<RefreshTokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken,
    }),
  });

  setAuthSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? refreshToken,
  });

  return result.accessToken;
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore network/logout backend errors
  } finally {
    clearAuthSession();
  }
}