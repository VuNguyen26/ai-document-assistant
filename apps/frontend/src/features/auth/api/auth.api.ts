import type { ApiEnvelope, LoginPayload, LoginResponse } from "../types/auth.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api/v1";

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
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}