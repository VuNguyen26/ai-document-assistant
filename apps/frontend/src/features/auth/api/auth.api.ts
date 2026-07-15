import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  setAuthSession,
  type StoredAuthUser,
} from "@/lib/auth/token-storage";
import type {
  ApiEnvelope,
  LoginPayload,
  LoginResponse,
} from "../types/auth.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

let authBootstrapPromise: Promise<StoredAuthUser> | null = null;

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

function storeAuthResponse(result: LoginResponse): void {
  setAuthSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  storeAuthResponse(result);

  return result;
}

export async function createGuestSession(): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>("/auth/guest", {
    method: "POST",
  });

  storeAuthResponse(result);

  return result;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const result = await apiFetch<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken,
    }),
  });

  storeAuthResponse(result);

  return result.accessToken;
}

export function ensureAuthSession(): Promise<StoredAuthUser> {
  const existingUser = getAuthUser();
  const accessToken = getAccessToken();

  if (
    existingUser &&
    accessToken &&
    typeof existingUser.isGuest === "boolean"
  ) {
    return Promise.resolve(existingUser);
  }

  if (!authBootstrapPromise) {
    authBootstrapPromise = (async () => {
      if (getRefreshToken()) {
        try {
          await refreshAccessToken();

          const refreshedUser = getAuthUser();

          if (refreshedUser) {
            return refreshedUser;
          }
        } catch {
          clearAuthSession();
        }
      }

      const guestSession = await createGuestSession();

      return guestSession.user;
    })().finally(() => {
      authBootstrapPromise = null;
    });
  }

  return authBootstrapPromise;
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
