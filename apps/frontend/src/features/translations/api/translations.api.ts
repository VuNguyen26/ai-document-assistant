import { refreshAccessToken } from '@/features/auth/api/auth.api';
import { clearAuthSession, getAccessToken } from '@/lib/auth/token-storage';
import type {
  CreateTranslationPayload,
  TranslationItem,
  TranslationsListResponse,
} from '../types/translations.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

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

export async function getTranslations(params?: {
  page?: number;
  limit?: number;
  documentId?: string;
  sourceType?: 'DOCUMENT' | 'SUMMARY';
}): Promise<TranslationsListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 10));

  if (params?.documentId) {
    searchParams.set('documentId', params.documentId);
  }

  if (params?.sourceType) {
    searchParams.set('sourceType', params.sourceType);
  }

  const result = await apiFetch<
    TranslationsListResponse | ApiEnvelope<TranslationsListResponse>
  >(`/translations?${searchParams.toString()}`, {
    method: 'GET',
  });

  return unwrapData(result);
}

export async function createTranslation(
  payload: CreateTranslationPayload,
): Promise<TranslationItem> {
  const result = await apiFetch<TranslationItem | ApiEnvelope<TranslationItem>>(
    '/translations/generate',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function deleteTranslation(
  translationId: string,
): Promise<{ id: string }> {
  const result = await apiFetch<
    { id: string } | ApiEnvelope<{ id: string }>
  >(`/translations/${translationId}`, {
    method: 'DELETE',
  });

  return unwrapData(result);
}