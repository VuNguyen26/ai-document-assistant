import { refreshAccessToken } from '@/features/auth/api/auth.api';
import { clearAuthSession, getAccessToken } from '@/lib/auth/token-storage';
import type {
  ApiEnvelope,
  AskChatPayload,
  AskChatResponse,
  ChatMessage,
  ChatSessionsResponse,
  RenameSessionPayload,
  StreamChatHandlers,
} from '../types/chat.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

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
  tokenOverride?: string | null,
): Promise<Response> {
  const token = tokenOverride ?? getAccessToken();

  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await rawFetch(path, init);

  if (response.status === 401) {
    try {
      const refreshedToken = await refreshAccessToken();
      response = await rawFetch(path, init, refreshedToken);
    } catch {
      clearAuthSession();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

function unwrapData<T>(result: T | ApiEnvelope<T>): T {
  if (
    result &&
    typeof result === 'object' &&
    'data' in result &&
    (result as ApiEnvelope<T>).data !== undefined
  ) {
    return (result as ApiEnvelope<T>).data;
  }

  return result as T;
}

export async function getChatSessions(params?: {
  page?: number;
  limit?: number;
  documentId?: string;
  workspaceId?: string;
}): Promise<ChatSessionsResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 20));

  if (params?.documentId) {
    searchParams.set('documentId', params.documentId);
  }

  if (params?.workspaceId) {
    searchParams.set('workspaceId', params.workspaceId);
  }

  return apiFetch<ChatSessionsResponse>(`/chat/sessions?${searchParams.toString()}`, {
    method: 'GET',
  });
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const result = await apiFetch<
    ChatMessage[] | ApiEnvelope<ChatMessage[]>
  >(`/chat/sessions/${sessionId}/messages`, {
    method: 'GET',
  });

  return unwrapData(result);
}

export async function askChat(
  payload: AskChatPayload,
): Promise<AskChatResponse> {
  const result = await apiFetch<AskChatResponse | ApiEnvelope<AskChatResponse>>(
    '/chat/ask',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function renameChatSession(
  sessionId: string,
  payload: RenameSessionPayload,
): Promise<{ id: string; title: string | null }> {
  const result = await apiFetch<
    { id: string; title: string | null } | ApiEnvelope<{ id: string; title: string | null }>
  >(`/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return unwrapData(result);
}

export async function deleteChatSession(
  sessionId: string,
): Promise<{ id: string }> {
  const result = await apiFetch<
    { id: string } | ApiEnvelope<{ id: string }>
  >(`/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  return unwrapData(result);
}

export async function streamChat(
  payload: AskChatPayload,
  handlers: StreamChatHandlers,
): Promise<void> {
  const makeRequest = async (tokenOverride?: string | null) =>
    rawFetch('/chat/ask/stream', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    }, tokenOverride);

  let response = await makeRequest();

  if (response.status === 401) {
    try {
      const refreshedToken = await refreshAccessToken();
      response = await makeRequest(refreshedToken);
    } catch {
      clearAuthSession();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (!response.body) {
    throw new Error('SSE response body is missing');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatchEvent = (eventName: string, dataLine: string) => {
    const parsed = JSON.parse(dataLine);

    if (eventName === 'meta') {
      handlers.onMeta?.(parsed);
      return;
    }

    if (eventName === 'delta') {
      handlers.onDelta?.(parsed);
      return;
    }

    if (eventName === 'done') {
      handlers.onDone?.(parsed);
      return;
    }

    if (eventName === 'error') {
      handlers.onError?.(parsed);
    }
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (buffer.includes('\n\n')) {
      const separatorIndex = buffer.indexOf('\n\n');
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const lines = rawEvent.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLine = lines.find((line) => line.startsWith('data:'));

      if (!eventLine || !dataLine) continue;

      const eventName = eventLine.replace('event:', '').trim();
      const eventData = dataLine.replace('data:', '').trim();

      if (!eventData) continue;

      dispatchEvent(eventName, eventData);
    }
  }
}