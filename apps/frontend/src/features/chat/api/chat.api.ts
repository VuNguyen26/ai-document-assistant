import { refreshAccessToken } from "@/features/auth/api/auth.api";
import { clearAuthSession, getAccessToken } from "@/lib/auth/token-storage";
import type {
  ApiEnvelope,
  AskChatPayload,
  AskChatResponse,
  ChatMessage,
  ChatSession,
  RenameSessionPayload,
} from "../types/chat.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api/v1";

async function parseError(response: Response): Promise<string> {
  let message = `Request failed with status ${response.status}`;

  try {
    const errorBody = await response.json();
    message = errorBody?.message || errorBody?.error || message;
  } catch {
    // ignore
  }

  return message;
}

async function rawFetch(
  path: string,
  init?: RequestInit,
  tokenOverride?: string | null
): Promise<Response> {
  const token = tokenOverride ?? getAccessToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await rawFetch(path, init);

  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      response = await rawFetch(path, init, newAccessToken);
    } catch {
      clearAuthSession();
      throw new Error("Unauthorized");
    }
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const json = (await response.json()) as T | ApiEnvelope<T>;

  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    (json as ApiEnvelope<T>).data !== undefined
  ) {
    return (json as ApiEnvelope<T>).data;
  }

  return json as T;
}

export async function getChatSessions(): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>("/chat/sessions", {
    method: "GET",
  });
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`, {
    method: "GET",
  });
}

export async function renameChatSession(
  sessionId: string,
  payload: RenameSessionPayload
): Promise<ChatSession> {
  return apiFetch<ChatSession>(`/chat/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function askChat(payload: AskChatPayload): Promise<AskChatResponse> {
  return apiFetch<AskChatResponse>("/chat/ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function buildAuthorizedStreamRequestInit(
  payload: AskChatPayload
): Promise<RequestInit> {
  let accessToken = getAccessToken();

  if (!accessToken) {
    try {
      accessToken = await refreshAccessToken();
    } catch {
      clearAuthSession();
      throw new Error("Unauthorized");
    }
  }

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  };
}

export function getChatStreamUrl(): string {
  return `${API_BASE_URL}/chat/ask/stream`;
}