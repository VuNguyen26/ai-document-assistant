import { refreshAccessToken } from '@/features/auth/api/auth.api';
import { clearAuthSession, getAccessToken } from '@/lib/auth/token-storage';
import type {
  AddWorkspaceDocumentPayload,
  CreateWorkspacePayload,
  WorkspaceDetail,
  WorkspacesListResponse,
  UpdateWorkspacePayload,
} from '../types/workspaces.types';

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

  headers.set('Content-Type', 'application/json');

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

export async function getWorkspaces(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<WorkspacesListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 10));

  if (params?.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const result = await apiFetch<
    WorkspacesListResponse | ApiEnvelope<WorkspacesListResponse>
  >(`/workspaces?${searchParams.toString()}`, {
    method: 'GET',
  });

  return unwrapData(result);
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<WorkspaceDetail> {
  const result = await apiFetch<WorkspaceDetail | ApiEnvelope<WorkspaceDetail>>(
    `/workspaces/${workspaceId}`,
    {
      method: 'GET',
    },
  );

  return unwrapData(result);
}

export async function createWorkspace(
  payload: CreateWorkspacePayload,
): Promise<WorkspaceDetail> {
  const result = await apiFetch<WorkspaceDetail | ApiEnvelope<WorkspaceDetail>>(
    '/workspaces',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload,
): Promise<WorkspaceDetail> {
  const result = await apiFetch<WorkspaceDetail | ApiEnvelope<WorkspaceDetail>>(
    `/workspaces/${workspaceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function deleteWorkspace(
  workspaceId: string,
): Promise<{ id: string }> {
  const result = await apiFetch<
    { id: string } | ApiEnvelope<{ id: string }>
  >(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });

  return unwrapData(result);
}

export async function addDocumentToWorkspace(
  workspaceId: string,
  payload: AddWorkspaceDocumentPayload,
): Promise<WorkspaceDetail> {
  const result = await apiFetch<WorkspaceDetail | ApiEnvelope<WorkspaceDetail>>(
    `/workspaces/${workspaceId}/documents`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function removeDocumentFromWorkspace(
  workspaceId: string,
  documentId: string,
): Promise<WorkspaceDetail> {
  const result = await apiFetch<WorkspaceDetail | ApiEnvelope<WorkspaceDetail>>(
    `/workspaces/${workspaceId}/documents/${documentId}`,
    {
      method: 'DELETE',
    },
  );

  return unwrapData(result);
}