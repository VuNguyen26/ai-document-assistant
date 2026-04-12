import { refreshAccessToken } from "@/features/auth/api/auth.api";
import { clearAuthSession, getAccessToken } from "@/lib/auth/token-storage";
import type {
  DeleteDocumentResponse,
  DocumentActionResult,
  DocumentChunk,
  DocumentDetailResponse,
  DocumentsListResponse,
  UploadDocumentResponse,
} from "../types/documents.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

type GetDocumentsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: "createdAt" | "updatedAt" | "title" | "status";
  sortOrder?: "asc" | "desc";
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

export async function getDocuments(
  params: GetDocumentsParams = {},
): Promise<DocumentsListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 12));

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status && params.status !== "ALL") {
    searchParams.set("status", params.status);
  }

  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const result = await apiFetch<
    DocumentsListResponse | ApiEnvelope<DocumentsListResponse>
  >(`/documents?${searchParams.toString()}`, {
    method: "GET",
  });

  return unwrapData(result);
}

export async function getDocumentById(
  documentId: string,
): Promise<DocumentDetailResponse> {
  const result = await apiFetch<
    DocumentDetailResponse | ApiEnvelope<DocumentDetailResponse>
  >(`/documents/${documentId}`, {
    method: "GET",
  });

  return unwrapData(result);
}

export async function getDocumentChunks(
  documentId: string,
): Promise<DocumentChunk[]> {
  const result = await apiFetch<DocumentChunk[] | ApiEnvelope<DocumentChunk[]>>(
    `/documents/${documentId}/chunks`,
    {
      method: "GET",
    },
  );

  return unwrapData(result);
}

export async function uploadDocument(
  file: File,
  title?: string,
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  const result = await apiFetch<
    UploadDocumentResponse | ApiEnvelope<UploadDocumentResponse>
  >("/documents/upload", {
    method: "POST",
    body: formData,
  });

  return unwrapData(result);
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResponse> {
  const result = await apiFetch<
    DeleteDocumentResponse | ApiEnvelope<DeleteDocumentResponse>
  >(`/documents/${documentId}`, {
    method: "DELETE",
  });

  return unwrapData(result);
}

export async function processDocument(
  documentId: string,
): Promise<DocumentActionResult> {
  const result = await apiFetch<
    DocumentActionResult | ApiEnvelope<DocumentActionResult>
  >(`/documents/${documentId}/process`, {
    method: "POST",
  });

  return unwrapData(result);
}

export async function reprocessDocument(
  documentId: string,
): Promise<DocumentActionResult> {
  const result = await apiFetch<
    DocumentActionResult | ApiEnvelope<DocumentActionResult>
  >(`/documents/${documentId}/reprocess`, {
    method: "POST",
  });

  return unwrapData(result);
}

export async function extractDocument(
  documentId: string,
): Promise<DocumentActionResult> {
  const result = await apiFetch<
    DocumentActionResult | ApiEnvelope<DocumentActionResult>
  >(`/documents/${documentId}/extract`, {
    method: "POST",
  });

  return unwrapData(result);
}

export async function chunkDocument(
  documentId: string,
): Promise<DocumentActionResult> {
  const result = await apiFetch<
    DocumentActionResult | ApiEnvelope<DocumentActionResult>
  >(`/documents/${documentId}/chunk`, {
    method: "POST",
  });

  return unwrapData(result);
}

export async function embedDocument(
  documentId: string,
): Promise<DocumentActionResult> {
  const result = await apiFetch<
    DocumentActionResult | ApiEnvelope<DocumentActionResult>
  >(`/documents/${documentId}/embed`, {
    method: "POST",
  });

  return unwrapData(result);
}