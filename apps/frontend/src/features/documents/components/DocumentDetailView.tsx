"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  chunkDocument,
  embedDocument,
  extractDocument,
  getDocumentById,
  getDocumentChunks,
  processDocument,
  reprocessDocument,
} from "../api/documents.api";
import DocumentJobsPanel from "./DocumentJobsPanel";
import type {
  DocumentChunk,
  DocumentDetailResponse,
} from "../types/documents.types";

type DocumentDetailViewProps = {
  documentId: string;
};

type DetailTab = "overview" | "content" | "chunks";

type ContentSnippet = {
  id: string;
  text: string;
  start: number;
  end: number;
};

function formatBytes(value: string) {
  const bytes = Number(value);

  if (Number.isNaN(bytes)) return value;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string) {
  switch (status) {
    case "READY":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "UPLOADED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "EXTRACTED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CHUNKED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "PROCESSING":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "UPLOADED":
      return "Đã upload";
    case "PROCESSING":
      return "Đang xử lý";
    case "EXTRACTED":
      return "Đã extract";
    case "CHUNKED":
      return "Đã chunk";
    case "READY":
      return "Sẵn sàng";
    case "FAILED":
      return "Thất bại";
    case "DELETED":
      return "Đã xóa";
    default:
      return status;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, keyword: string): ReactNode {
  const query = keyword.trim();

  if (!query) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === query.toLowerCase();

    if (!isMatch) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-yellow-200 px-1 text-inherit"
      >
        {part}
      </mark>
    );
  });
}

function buildContentSnippets(
  text: string,
  keyword: string,
  radius = 90,
  maxResults = 20,
): ContentSnippet[] {
  const query = keyword.trim();

  if (!query || !text.trim()) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const snippets: ContentSnippet[] = [];

  let cursor = 0;
  let index = 0;

  while (snippets.length < maxResults) {
    const foundIndex = lowerText.indexOf(lowerQuery, cursor);

    if (foundIndex === -1) {
      break;
    }

    const start = Math.max(0, foundIndex - radius);
    const end = Math.min(text.length, foundIndex + query.length + radius);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < text.length ? "..." : "";

    snippets.push({
      id: `${foundIndex}-${index}`,
      text: `${prefix}${text.slice(start, end)}${suffix}`,
      start,
      end,
    });

    cursor = foundIndex + lowerQuery.length;
    index += 1;
  }

  return snippets;
}

function getRecommendedAction(status: string) {
  switch (status) {
    case "UPLOADED":
      return {
        title: "Khuyến nghị: chạy Extract",
        description:
          "Tài liệu mới chỉ được upload. Bước đúng tiếp theo là extract nội dung text từ file gốc.",
        tone: "amber" as const,
      };
    case "EXTRACTED":
      return {
        title: "Khuyến nghị: chạy Chunk",
        description:
          "Tài liệu đã có text, nhưng chưa chia nhỏ để retrieval. Hãy chạy chunk trước khi embed.",
        tone: "sky" as const,
      };
    case "CHUNKED":
      return {
        title: "Khuyến nghị: chạy Embed",
        description:
          "Document đã có chunks. Bước tiếp theo là tạo embeddings để semantic search và chat hoạt động.",
        tone: "indigo" as const,
      };
    case "FAILED":
      return {
        title: "Khuyến nghị: Reprocess từ đầu",
        description:
          "Pipeline trước đó đã lỗi. Nên reprocess để xóa dữ liệu cũ và chạy lại toàn bộ luồng xử lý.",
        tone: "rose" as const,
      };
    case "PROCESSING":
      return {
        title: "Tài liệu đang được xử lý",
        description:
          "Hệ thống đang chạy pipeline. Hiện chưa nên bấm thêm các bước manual.",
        tone: "blue" as const,
      };
    case "READY":
      return {
        title: "Khuyến nghị: Chat với tài liệu",
        description:
          "Document đã sẵn sàng. Anh có thể bắt đầu chat hoặc reprocess nếu muốn xử lý lại từ đầu.",
        tone: "emerald" as const,
      };
    default:
      return {
        title: "Theo dõi trạng thái tài liệu",
        description:
          "Hãy kiểm tra trạng thái hiện tại để quyết định bước xử lý tiếp theo.",
        tone: "slate" as const,
      };
  }
}

function getRecommendationClass(
  tone: "amber" | "sky" | "indigo" | "rose" | "blue" | "emerald" | "slate",
) {
  switch (tone) {
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "indigo":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Không thể copy vào clipboard.");
  }
}

export default function DocumentDetailView({
  documentId,
}: DocumentDetailViewProps) {
  const router = useRouter();

  const [document, setDocument] = useState<DocumentDetailResponse | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "process" | "reprocess" | "extract" | "chunk" | "embed" | null
  >(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [contentSearch, setContentSearch] = useState("");
  const [chunkSearch, setChunkSearch] = useState("");
  const [reprocessDialogOpen, setReprocessDialogOpen] = useState(false);

  async function loadDocument() {
    try {
      setLoading(true);
      setError("");

      const [documentData, chunkData] = await Promise.all([
        getDocumentById(documentId),
        getDocumentChunks(documentId).catch(() => []),
      ]);

      setDocument(documentData);
      setChunks(chunkData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải chi tiết tài liệu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDocumentDetail() {
    try {
      const [documentData, chunkData] = await Promise.all([
        getDocumentById(documentId),
        getDocumentChunks(documentId).catch(() => chunks),
      ]);

      setDocument(documentData);
      setChunks(chunkData);
    } catch {
      // silent refresh for polling panel
    }
  }

  async function runAction(
    type: "process" | "reprocess" | "extract" | "chunk" | "embed",
  ) {
    try {
      setActionLoading(type);
      setError("");

      if (type === "process") {
        const result = await processDocument(documentId);
        toast.success(result.message || "Đã đưa tài liệu vào hàng đợi xử lý.");
      } else if (type === "reprocess") {
        const result = await reprocessDocument(documentId);
        toast.success(
          result.message || "Đã đưa tài liệu vào hàng đợi reprocess.",
        );
      } else if (type === "extract") {
        await extractDocument(documentId);
        toast.success("Extract thành công.");
      } else if (type === "chunk") {
        await chunkDocument(documentId);
        toast.success("Chunk thành công.");
      } else {
        await embedDocument(documentId);
        toast.success("Embed thành công.");
      }

      await loadDocument();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Thao tác pipeline thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    void loadDocument();
  }, [documentId]);

  const extractedText = useMemo(() => {
    if (!document?.content) return "";

    return (
      document.content.cleanedText ||
      document.content.extractedText ||
      document.content.rawText ||
      document.content.text ||
      ""
    );
  }, [document]);

  const contentQuery = contentSearch.trim();
  const chunkQuery = chunkSearch.trim();

  const contentSnippets = useMemo(
    () => buildContentSnippets(extractedText, contentQuery),
    [extractedText, contentQuery],
  );

  const contentMatchCount = contentSnippets.length;

  const filteredChunks = useMemo(() => {
    if (!chunkQuery) {
      return chunks;
    }

    return chunks.filter((chunk) =>
      chunk.content.toLowerCase().includes(chunkQuery.toLowerCase()),
    );
  }, [chunks, chunkQuery]);

  const hasExtractedText = extractedText.trim().length > 0;
  const hasChunks = chunks.length > 0;
  const isReady = document?.status === "READY";
  const isProcessing = document?.status === "PROCESSING";

  const canExtract = !isProcessing && actionLoading === null;
  const canChunk =
    !isProcessing &&
    actionLoading === null &&
    (document?.status === "EXTRACTED" || document?.status === "FAILED") &&
    hasExtractedText;
  const canEmbed =
    !isProcessing &&
    actionLoading === null &&
    (document?.status === "CHUNKED" || document?.status === "FAILED") &&
    hasChunks;
  const canProcess = !isProcessing && actionLoading === null && !isReady;
  const canReprocess = !isProcessing && actionLoading === null;

  const recommendedAction = getRecommendedAction(document?.status ?? "UPLOADED");

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "content" as const, label: "Content" },
    { key: "chunks" as const, label: "Chunks" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="mt-6 h-16 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="mt-6 h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy tài liệu
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Tài liệu này có thể đã bị xóa hoặc anh không có quyền truy cập.
          </p>
          <button
            type="button"
            onClick={() => router.push("/documents")}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Quay lại Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/documents")}
                  className="mb-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ← Quay lại Documents
                </button>

                <p className="text-sm font-medium text-slate-500">
                  Document Detail
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {document.title}
                </h1>
                <p className="mt-2 max-w-3xl break-all text-sm text-slate-500">
                  {document.originalFilename}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runAction("process")}
                  disabled={!canProcess}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isReady
                    ? "Đã sẵn sàng"
                    : actionLoading === "process"
                      ? "Đang xử lý..."
                      : "Process document"}
                </button>

                <button
                  type="button"
                  onClick={() => setReprocessDialogOpen(true)}
                  disabled={!canReprocess}
                  className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === "reprocess"
                    ? "Đang reprocess..."
                    : "Reprocess từ đầu"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("extract")}
                  disabled={!canExtract}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "extract" ? "Đang extract..." : "Extract"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("chunk")}
                  disabled={!canChunk}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "chunk" ? "Đang chunk..." : "Chunk"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("embed")}
                  disabled={!canEmbed}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "embed" ? "Đang embed..." : "Embed"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/documents/${document.id}/chat`)}
                  disabled={!isReady}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Chat với tài liệu
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                    document.status,
                  )}`}
                >
                  {statusLabel(document.status)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {chunks.length} chunks
                </span>
              </div>

              {!isReady ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Anh có thể bấm <strong>Process document</strong> để hệ thống tự
                  chạy đủ 3 bước: Extract → Chunk → Embed.
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Document đã ở trạng thái <strong>READY</strong> và có thể chat.
                </div>
              )}
            </div>

            <div
              className={`mt-4 rounded-2xl border px-4 py-4 ${getRecommendationClass(
                recommendedAction.tone,
              )}`}
            >
              <p className="text-sm font-semibold">{recommendedAction.title}</p>
              <p className="mt-1 text-sm">{recommendedAction.description}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <strong>Reprocess từ đầu</strong> sẽ xóa extracted content, chunks và
              embeddings hiện tại rồi chạy lại toàn bộ pipeline.
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-6">
              <DocumentJobsPanel
                documentId={documentId}
                latestJob={(document as any)?.latestJob ?? null}
                documentStatus={(document as any)?.status ?? null}
                onRefreshDocument={refreshDocumentDetail}
              />

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Tổng quan tài liệu
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Metadata và trạng thái hiện tại của document.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        MIME Type
                      </p>
                      <p className="mt-2 break-words text-sm font-medium text-slate-700">
                        {document.mimeType}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Kích thước
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {formatBytes(document.fileSize)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Ngôn ngữ
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {document.sourceLanguage || "Chưa xác định"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Số trang
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {document.pageCount ?? "Chưa có"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tạo lúc
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {formatDate(document.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Cập nhật
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {formatDate(document.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {document.errorMessage ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {document.errorMessage}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Pipeline trạng thái
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      READY chỉ xuất hiện sau khi embed thành công.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: "1. Extract",
                        desc: "Trích xuất nội dung text từ file gốc.",
                        active: hasExtractedText,
                      },
                      {
                        title: "2. Chunk",
                        desc: "Chia document thành các chunk để retrieval.",
                        active: hasChunks,
                      },
                      {
                        title: "3. Embed",
                        desc: "Sinh vector embedding để semantic search và chat.",
                        active: isReady,
                      },
                    ].map((step) => (
                      <div
                        key={step.title}
                        className={`rounded-2xl border p-4 ${
                          step.active
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {step.desc}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              step.active
                                ? "bg-white text-emerald-700"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            {step.active ? "Done" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Chunk count
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {chunks.length}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "content" ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Extracted Content
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Nội dung văn bản đã được hệ thống trích xuất từ tài liệu.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Tìm trong nội dung..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:w-72"
                  />

                  {hasExtractedText ? (
                    <button
                      type="button"
                      onClick={() =>
                        void copyToClipboard(extractedText, "Đã copy extracted content.")
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Copy content
                    </button>
                  ) : null}
                </div>
              </div>

              {contentQuery ? (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Tìm thấy <strong>{contentMatchCount}</strong> kết quả trong content.
                </div>
              ) : null}

              {hasExtractedText ? (
                <>
                  {contentQuery ? (
                    <>
                      {contentSnippets.length > 0 ? (
                        <div className="mb-6 space-y-3">
                          {contentSnippets.map((snippet, index) => (
                            <div
                              key={snippet.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Match #{index + 1}
                              </div>
                              <p className="text-sm leading-6 text-slate-700">
                                {renderHighlightedText(snippet.text, contentQuery)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            Không tìm thấy từ khóa trong content
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Hãy thử từ khóa khác.
                          </p>
                        </div>
                      )}
                    </>
                  ) : null}

                  <div className="max-h-[720px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                      {renderHighlightedText(extractedText, contentQuery)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    📄
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa có extracted text
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy chạy bước Extract hoặc Process document.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "chunks" ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Chunks</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Các chunk hiện có dùng cho retrieval và chat grounded.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={chunkSearch}
                    onChange={(e) => setChunkSearch(e.target.value)}
                    placeholder="Tìm trong chunks..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:w-72"
                  />

                  {hasChunks ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {filteredChunks.length}/{chunks.length} chunk(s)
                    </span>
                  ) : null}
                </div>
              </div>

              {hasChunks ? (
                filteredChunks.length > 0 ? (
                  <div className="space-y-3">
                    {filteredChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              Chunk #{chunk.chunkIndex}
                            </span>
                            <span className="text-xs text-slate-500">
                              {chunk.charCount} ký tự
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                chunk.content,
                                `Đã copy chunk #${chunk.chunkIndex}.`,
                              )
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Copy chunk
                          </button>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {renderHighlightedText(chunk.content, chunkQuery)}
                        </p>

                        <div className="mt-3 flex gap-3 text-xs text-slate-400">
                          <span>start: {chunk.startOffset ?? "-"}</span>
                          <span>end: {chunk.endOffset ?? "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                      🔎
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      Không có chunk nào khớp từ khóa
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Hãy thử từ khóa khác hoặc xóa bộ lọc hiện tại.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    ✂️
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa có chunk nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy chạy bước Chunk hoặc Process document.
                  </p>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={reprocessDialogOpen}
        title="Reprocess tài liệu từ đầu?"
        description="Hành động này sẽ xóa extracted content, chunks và embeddings hiện tại rồi chạy lại toàn bộ pipeline. Chỉ dùng khi anh thật sự muốn xử lý lại tài liệu."
        confirmText={actionLoading === "reprocess" ? "Đang reprocess..." : "Reprocess từ đầu"}
        cancelText="Hủy"
        tone="danger"
        loading={actionLoading === "reprocess"}
        onCancel={() => {
          if (actionLoading === "reprocess") return;
          setReprocessDialogOpen(false);
        }}
        onConfirm={async () => {
          setReprocessDialogOpen(false);
          await runAction("reprocess");
        }}
      />
    </>
  );
}