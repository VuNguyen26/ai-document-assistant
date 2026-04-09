"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getDocuments } from "@/features/documents/api/documents.api";
import type { DocumentItem } from "@/features/documents/types/documents.types";
import {
  createSummary,
  deleteSummary,
  getSummaries,
} from "../api/summaries.api";
import type {
  SummariesListResponse,
  SummaryItem,
  SummaryType,
} from "../types/summaries.types";

const PAGE_SIZE = 10;

const SUMMARY_TYPE_OPTIONS: Array<{ value: SummaryType; label: string }> = [
  { value: "SHORT", label: "Short" },
  { value: "DETAILED", label: "Detailed" },
  { value: "BULLET", label: "Bullet" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "PRESENTATION", label: "Presentation" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Không thể copy vào clipboard.");
  }
}

export default function SummariesPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [pagination, setPagination] = useState<SummariesListResponse["pagination"]>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SummaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [documentId, setDocumentId] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>("DETAILED");
  const [language, setLanguage] = useState("vi");
  const [promptStyle, setPromptStyle] = useState("");
  const [filterDocumentId, setFilterDocumentId] = useState("");
  const [page, setPage] = useState(1);

  async function loadDocuments() {
    const data = await getDocuments({
      page: 1,
      limit: 100,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    setDocuments(data.items);
  }

  async function loadSummaries(nextPage = page, nextDocumentId = filterDocumentId) {
    try {
      setLoading(true);

      const data = await getSummaries({
        page: nextPage,
        limit: PAGE_SIZE,
        documentId: nextDocumentId || undefined,
      });

      setSummaries(data.items);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải summaries",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!documentId) {
      toast.error("Anh cần chọn document trước.");
      return;
    }

    try {
      setGenerating(true);

      await createSummary({
        documentId,
        summaryType,
        language: language.trim() || "vi",
        promptStyle: promptStyle.trim() || undefined,
      });

      toast.success("Tạo summary thành công.");
      setPage(1);
      await loadSummaries(1, filterDocumentId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Tạo summary thất bại",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function confirmDeleteSummary() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteSummary(deleteTarget.id);
      toast.success("Đã xóa summary.");
      setDeleteTarget(null);

      const nextPage =
        summaries.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadSummaries(nextPage, filterDocumentId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xóa summary thất bại",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    void loadSummaries(page, filterDocumentId);
  }, [page, filterDocumentId]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === documentId) || null,
    [documents, documentId],
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4">
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ← Về Dashboard
                </Link>
              </div>

              <p className="text-sm font-medium text-slate-500">
                AI Document Assistant
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Summaries
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Tạo summary thật từ tài liệu đã extract, lưu lại lịch sử và tái sử dụng khi cần.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total summaries
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {pagination.total}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Generate summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Summary dùng extracted content của document hiện tại.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                    <label
                      htmlFor="summary-document"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Document
                    </label>
                    <select
                      id="summary-document"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                    <option value="">Chọn tài liệu...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} — {doc.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="summary-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Summary type
                    </label>
                    <select
                      id="summary-type"
                      value={summaryType}
                      onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      {SUMMARY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="summary-language"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Language
                    </label>
                    <input
                      id="summary-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="vi / en / ja..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="summary-prompt-style"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Prompt style
                  </label>
                  <input
                    id="summary-prompt-style"
                    value={promptStyle}
                    onChange={(e) => setPromptStyle(e.target.value)}
                    placeholder="Ví dụ: chuyên nghiệp, ngắn gọn, dễ hiểu..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                {selectedDocument ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{selectedDocument.title}</p>
                    <p className="mt-1">{selectedDocument.originalFilename}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status: {selectedDocument.status}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleGenerateSummary()}
                  disabled={generating}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {generating ? "Đang tạo summary..." : "Generate summary"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Summary history
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Danh sách summary đã tạo và lưu lại theo document.
                  </p>
                </div>

                <div className="w-full sm:w-72">
                  <label
                    htmlFor="summary-filter-document"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Filter by document
                  </label>
                  <select
                    id="summary-filter-document"
                    value={filterDocumentId}
                    onChange={(e) => {
                      setFilterDocumentId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Tất cả tài liệu</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              ) : summaries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    📝
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa có summary nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy tạo summary đầu tiên từ một document đã extract.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {summaries.map((summary) => (
                      <article
                        key={summary.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {summary.documentTitle}
                            </h3>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {summary.documentOriginalFilename}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {summary.summaryType}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {summary.language}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {formatDate(summary.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void copyToClipboard(
                                  summary.content,
                                  "Đã copy summary.",
                                )
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Copy
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(summary)}
                              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {summary.promptStyle ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                            Prompt style: {summary.promptStyle}
                          </div>
                        ) : null}

                        <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
                          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                            {summary.content}
                          </pre>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Model: {summary.createdByAiModel}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
                    <p className="text-sm text-slate-500">
                      Trang{" "}
                      <span className="font-semibold text-slate-900">
                        {pagination.page}
                      </span>{" "}
                      / {pagination.totalPages}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={pagination.page <= 1}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trang trước
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(pagination.totalPages, prev + 1),
                          )
                        }
                        disabled={pagination.page >= pagination.totalPages}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa summary?"
        description={`Summary của tài liệu "${deleteTarget?.documentTitle || ""}" sẽ bị xóa khỏi lịch sử.`}
        confirmText={isDeleting ? "Đang xóa..." : "Xóa summary"}
        cancelText="Hủy"
        tone="danger"
        loading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteSummary()}
      />
    </>
  );
}