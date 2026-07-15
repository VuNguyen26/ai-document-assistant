"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
      return "Đã tải lên";
    case "PROCESSING":
      return "Đang xử lý";
    case "EXTRACTED":
      return "Đã trích xuất";
    case "CHUNKED":
      return "Đã chia đoạn";
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
        title: "Khuyến nghị: chạy trích xuất",
        description:
          "Tài liệu mới chỉ được tải lên. Bước tiếp theo là trích xuất nội dung văn bản từ tệp gốc.",
        tone: "amber" as const,
      };
    case "EXTRACTED":
      return {
        title: "Khuyến nghị: chạy chia đoạn",
        description:
          "Tài liệu đã có nội dung văn bản, nhưng chưa được chia thành các đoạn nhỏ để truy xuất. Hãy chạy bước chia đoạn trước khi tạo embedding.",
        tone: "sky" as const,
      };
    case "CHUNKED":
      return {
        title: "Khuyến nghị: tạo embedding",
        description:
          "Tài liệu đã có các đoạn nội dung. Bước tiếp theo là tạo embedding để tìm kiếm ngữ nghĩa và chat hoạt động.",
        tone: "indigo" as const,
      };
    case "FAILED":
      return {
        title: "Khuyến nghị: xử lý lại từ đầu",
        description:
          "Quy trình trước đó đã lỗi. Nên xử lý lại để xóa dữ liệu cũ và chạy lại toàn bộ luồng xử lý.",
        tone: "rose" as const,
      };
    case "PROCESSING":
      return {
        title: "Tài liệu đang được xử lý",
        description:
          "Hệ thống đang chạy quy trình xử lý. Hiện tại chưa nên bấm thêm các bước thủ công.",
        tone: "blue" as const,
      };
    case "READY":
      return {
        title: "Khuyến nghị: chat với tài liệu",
        description:
          "Tài liệu đã sẵn sàng. Bạn có thể bắt đầu chat hoặc xử lý lại nếu muốn chạy lại từ đầu.",
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
    toast.error("Không thể sao chép vào clipboard.");
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

  const loadDocument = useCallback(async () => {
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
  }, [documentId]);

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
          result.message || "Đã đưa tài liệu vào hàng đợi xử lý lại.",
        );
      } else if (type === "extract") {
        await extractDocument(documentId);
        toast.success("Trích xuất nội dung thành công.");
      } else if (type === "chunk") {
        await chunkDocument(documentId);
        toast.success("Chia đoạn thành công.");
      } else {
        await embedDocument(documentId);
        toast.success("Tạo embedding thành công.");
      }

      await loadDocument();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Thao tác xử lý tài liệu thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

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

  const recommendedAction = getRecommendedAction(
    document?.status ?? "UPLOADED",
  );

  const tabs = [
    { key: "overview" as const, label: "Tổng quan" },
    { key: "content" as const, label: "Nội dung" },
    { key: "chunks" as const, label: "Đoạn nội dung" },
  ];

  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-[28px] border border-slate-200 bg-white shadow-sm" />
          <div className="h-16 animate-pulse rounded-[20px] border border-slate-200 bg-white shadow-sm" />
          <div className="h-[520px] animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy tài liệu
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Tài liệu này có thể đã bị xóa hoặc bạn không có quyền truy cập.
          </p>
          <button
            type="button"
            onClick={() => router.push("/documents")}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Quay lại tài liệu
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-start">
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/documents")}
                  className="mb-5 inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  ← Quay lại tài liệu
                </button>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                  Chi tiết tài liệu
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                  {document.title}
                </h1>
                <p className="mt-2 max-w-3xl break-all text-sm text-slate-500">
                  {document.originalFilename}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[520px]">
                <button
                  type="button"
                  onClick={() => void runAction("process")}
                  disabled={!canProcess}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isReady
                    ? "Đã sẵn sàng"
                    : actionLoading === "process"
                      ? "Đang xử lý..."
                      : "Xử lý tài liệu"}
                </button>

                <button
                  type="button"
                  onClick={() => setReprocessDialogOpen(true)}
                  disabled={!canReprocess}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-100 bg-white px-3.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {actionLoading === "reprocess"
                    ? "Đang xử lý lại..."
                    : "Xử lý lại từ đầu"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("extract")}
                  disabled={!canExtract}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "extract"
                    ? "Đang trích xuất..."
                    : "Trích xuất"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("chunk")}
                  disabled={!canChunk}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "chunk"
                    ? "Đang chia đoạn..."
                    : "Chia đoạn"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("embed")}
                  disabled={!canEmbed}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "embed"
                    ? "Đang tạo embedding..."
                    : "Tạo embedding"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/documents/${document.id}/chat`)}
                  disabled={!isReady}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Chat với tài liệu
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/documents/${document.id}/audio`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Audio / TTS
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
                  {chunks.length} đoạn
                </span>
              </div>

              {!isReady ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Bạn có thể bấm <strong>Xử lý tài liệu</strong> để hệ thống tự
                  chạy đủ 3 bước: Trích xuất → Chia đoạn → Tạo embedding.
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Tài liệu đã ở trạng thái <strong>Sẵn sàng</strong> và có thể
                  chat.
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
              <strong>Xử lý lại từ đầu</strong> sẽ xóa nội dung đã trích xuất,
              các đoạn nội dung và embedding hiện tại, sau đó chạy lại toàn bộ
              quy trình xử lý.
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-1.5 shadow-sm">
            <div className="grid grid-cols-3 gap-1.5">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
              <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                      {"Th\xf4ng tin t\u1ec7p"}
                    </p>
                    <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
                      {"T\u1ed5ng quan t\xe0i li\u1ec7u"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        "Metadata, dung l\u01b0\u1ee3ng v\xe0 th\u1eddi gian c\u1eadp nh\u1eadt hi\u1ec7n t\u1ea1i."
                      }
                    </p>
                  </div>

                  <dl className="grid sm:grid-cols-2">
                    {[
                      {
                        label: "Lo\u1ea1i MIME",
                        value: document.mimeType,
                      },
                      {
                        label: "K\xedch th\u01b0\u1edbc",
                        value: formatBytes(document.fileSize),
                      },
                      {
                        label: "Ng\xf4n ng\u1eef",
                        value:
                          document.sourceLanguage ||
                          "Ch\u01b0a x\xe1c \u0111\u1ecbnh",
                      },
                      {
                        label: "S\u1ed1 trang",
                        value:
                          document.pageCount?.toString() || "Ch\u01b0a c\xf3",
                      },
                      {
                        label: "T\u1ea1o l\xfac",
                        value: formatDate(document.createdAt),
                      },
                      {
                        label: "C\u1eadp nh\u1eadt",
                        value: formatDate(document.updatedAt),
                      },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className={`min-w-0 px-5 py-4 sm:px-6 ${
                          index < 4 ? "border-b border-slate-200" : ""
                        } ${
                          index % 2 === 0
                            ? "sm:border-r sm:border-slate-200"
                            : ""
                        }`}
                      >
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {item.label}
                        </dt>
                        <dd className="mt-1.5 break-words text-sm font-semibold text-slate-700">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {document.errorMessage &&
                  document.errorMessage !== document.latestJob?.errorMessage ? (
                    <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                        {document.errorMessage}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                      {"Pipeline"}
                    </p>
                    <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
                      {"Tr\u1ea1ng th\xe1i quy tr\xecnh"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        "T\xe0i li\u1ec7u ch\u1ec9 s\u1eb5n s\xe0ng sau khi ho\xe0n t\u1ea5t c\u1ea3 ba b\u01b0\u1edbc."
                      }
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {[
                      {
                        number: "01",
                        title: "Tr\xedch xu\u1ea5t",
                        description:
                          "Chuy\u1ec3n n\u1ed9i dung t\u1eeb t\u1ec7p g\u1ed1c th\xe0nh v\u0103n b\u1ea3n.",
                        active: hasExtractedText,
                      },
                      {
                        number: "02",
                        title: "Chia \u0111o\u1ea1n",
                        description:
                          "Chia n\u1ed9i dung th\xe0nh c\xe1c \u0111o\u1ea1n ph\u1ee5c v\u1ee5 truy xu\u1ea5t.",
                        active: hasChunks,
                      },
                      {
                        number: "03",
                        title: "T\u1ea1o embedding",
                        description:
                          "Sinh vector cho t\xecm ki\u1ebfm ng\u1eef ngh\u0129a v\xe0 chat.",
                        active: isReady,
                      },
                    ].map((step) => (
                      <div
                        key={step.number}
                        className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3 px-5 py-4 sm:px-6"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                            step.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step.number}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {step.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {step.description}
                          </p>
                        </div>

                        <span
                          className={`mt-0.5 inline-flex h-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                            step.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step.active
                            ? "Ho\xe0n t\u1ea5t"
                            : "\u0110ang ch\u1edd"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {"S\u1ed1 \u0111o\u1ea1n hi\u1ec7n c\xf3"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {"D\xf9ng cho truy xu\u1ea5t v\xe0 chat"}
                      </p>
                    </div>

                    <span className="text-2xl font-semibold tracking-tight text-slate-950">
                      {chunks.length}
                    </span>
                  </div>
                </section>
              </div>

              <DocumentJobsPanel
                documentId={documentId}
                latestJob={document.latestJob ?? null}
                documentStatus={document.status ?? null}
                onRefreshDocument={refreshDocumentDetail}
              />
            </div>
          ) : null}
          {activeTab === "content" ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Nội dung đã trích xuất
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Nội dung văn bản đã được hệ thống trích xuất từ tài liệu.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    aria-label="Tìm trong nội dung đã trích xuất"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Tìm trong nội dung..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:w-72"
                  />

                  {hasExtractedText ? (
                    <button
                      type="button"
                      onClick={() =>
                        void copyToClipboard(
                          extractedText,
                          "Đã sao chép nội dung đã trích xuất.",
                        )
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Sao chép nội dung
                    </button>
                  ) : null}
                </div>
              </div>

              {contentQuery ? (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Tìm thấy <strong>{contentMatchCount}</strong> kết quả trong
                  nội dung.
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
                                Kết quả #{index + 1}
                              </div>
                              <p className="text-sm leading-6 text-slate-700">
                                {renderHighlightedText(
                                  snippet.text,
                                  contentQuery,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            Không tìm thấy từ khóa trong nội dung
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
                    Chưa có nội dung đã trích xuất
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy chạy bước Trích xuất hoặc Xử lý tài liệu.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "chunks" ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Đoạn nội dung
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Các đoạn nội dung hiện có dùng cho truy xuất và chat có căn
                    cứ.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    aria-label="Tìm trong các đoạn nội dung"
                    value={chunkSearch}
                    onChange={(e) => setChunkSearch(e.target.value)}
                    placeholder="Tìm trong đoạn nội dung..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:w-72"
                  />

                  {hasChunks ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {filteredChunks.length}/{chunks.length} đoạn
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
                              Đoạn #{chunk.chunkIndex}
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
                                `Đã sao chép đoạn #${chunk.chunkIndex}.`,
                              )
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Sao chép đoạn
                          </button>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {renderHighlightedText(chunk.content, chunkQuery)}
                        </p>

                        <div className="mt-3 flex gap-3 text-xs text-slate-400">
                          <span>Bắt đầu: {chunk.startOffset ?? "-"}</span>
                          <span>Kết thúc: {chunk.endOffset ?? "-"}</span>
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
                      Không có đoạn nào khớp từ khóa
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
                    Chưa có đoạn nội dung nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy chạy bước Chia đoạn hoặc Xử lý tài liệu.
                  </p>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={reprocessDialogOpen}
        title="Xử lý lại tài liệu từ đầu?"
        description="Hành động này sẽ xóa nội dung đã trích xuất, các đoạn nội dung và embedding hiện tại, sau đó chạy lại toàn bộ quy trình xử lý. Chỉ dùng khi bạn thật sự muốn xử lý lại tài liệu."
        confirmText={
          actionLoading === "reprocess"
            ? "Đang xử lý lại..."
            : "Xử lý lại từ đầu"
        }
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
