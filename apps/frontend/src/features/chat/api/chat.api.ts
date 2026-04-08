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

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const possibleKeys = [
    "accessToken",
    "token",
    "authToken",
    "jwt",
    "access_token",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  try {
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      return parsed?.accessToken || parsed?.token || null;
    }
  } catch {
    // ignore parse error
  }

  return null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export function buildStreamRequestInit(payload: AskChatPayload): RequestInit {
  const token = getAuthToken();

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  };
}

export function getChatStreamUrl(): string {
  return `${API_BASE_URL}/chat/ask/stream`;
}