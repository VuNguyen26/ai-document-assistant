import { refreshAccessToken } from "@/features/auth/api/auth.api";
import { clearAuthSession, getAccessToken } from "@/lib/auth/token-storage";
import type {
  CreateSummaryPayload,
  SummariesListResponse,
  SummaryItem,
} from "../types/summaries.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

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
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
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
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
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
    typeof result === "object" &&
    "data" in result &&
    (result as ApiEnvelope<T>).data !== undefined
  ) {
    return (result as ApiEnvelope<T>).data;
  }

  return result as T;
}

export async function getSummaries(params?: {
  page?: number;
  limit?: number;
  documentId?: string;
}): Promise<SummariesListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params?.page ?? 1));
  searchParams.set("limit", String(params?.limit ?? 10));

  if (params?.documentId) {
    searchParams.set("documentId", params.documentId);
  }

  const result = await apiFetch<
    SummariesListResponse | ApiEnvelope<SummariesListResponse>
  >(`/summaries?${searchParams.toString()}`, {
    method: "GET",
  });

  return unwrapData(result);
}

export async function createSummary(
  payload: CreateSummaryPayload,
): Promise<SummaryItem> {
  const result = await apiFetch<SummaryItem | ApiEnvelope<SummaryItem>>(
    "/summaries/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(result);
}

export async function deleteSummary(summaryId: string): Promise<{ id: string }> {
  const result = await apiFetch<{ id: string } | ApiEnvelope<{ id: string }>>(
    `/summaries/${summaryId}`,
    {
      method: "DELETE",
    },
  );

  return unwrapData(result);
}