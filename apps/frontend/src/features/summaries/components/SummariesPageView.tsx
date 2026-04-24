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
  { value: "BULLET", label: "Bullet points" },
  { value: "BEGINNER", label: "Beginner friendly" },
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

function getSummaryTypeLabel(type: SummaryType) {
  return (
    SUMMARY_TYPE_OPTIONS.find((option) => option.value === type)?.label || type
  );
}

function truncateText(value: string, maxLength = 520) {
  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) return clean;

  return `${clean.slice(0, maxLength)}...`;
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Cannot copy to clipboard.");
  }
}

export default function SummariesPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [pagination, setPagination] =
    useState<SummariesListResponse["pagination"]>({
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
    try {
      const data = await getDocuments({
        page: 1,
        limit: 100,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      setDocuments(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot load documents.",
      );
    }
  }

  async function loadSummaries(
    nextPage = page,
    nextDocumentId = filterDocumentId,
  ) {
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
        error instanceof Error ? error.message : "Cannot load summaries.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!documentId) {
      toast.error("Please select a document first.");
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

      toast.success("Summary created.");
      setPage(1);
      await loadSummaries(1, filterDocumentId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot create summary.",
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
      toast.success("Summary deleted.");
      setDeleteTarget(null);

      const nextPage = summaries.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadSummaries(nextPage, filterDocumentId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot delete summary.",
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

  const hasSummaries = summaries.length > 0;

  return (
    <>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  ← Back to dashboard
                </Link>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Summary workspace
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Create document summaries
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Generate reusable summaries from processed documents and keep
                  a clean history for later use.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                    SUM
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {pagination.total}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Total summaries
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Saved summary records
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    DOC
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {documents.length}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Available documents
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Documents loaded for selection
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  Generate
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  New summary
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select a document and choose the output style.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="summary-document"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Document
                  </label>

                  <select
                    id="summary-document"
                    value={documentId}
                    onChange={(event) => setDocumentId(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">Select document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} — {doc.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <label
                      htmlFor="summary-type"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Summary type
                    </label>

                    <select
                      id="summary-type"
                      value={summaryType}
                      onChange={(event) =>
                        setSummaryType(event.target.value as SummaryType)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    >
                      {SUMMARY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="summary-language"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Language
                    </label>

                    <input
                      id="summary-language"
                      type="text"
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      placeholder="vi / en / ja"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="summary-prompt-style"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Prompt style
                  </label>

                  <input
                    id="summary-prompt-style"
                    type="text"
                    value={promptStyle}
                    onChange={(event) => setPromptStyle(event.target.value)}
                    placeholder="Professional, concise, beginner friendly..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {selectedDocument ? (
                  <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {selectedDocument.title}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {selectedDocument.originalFilename}
                    </p>

                    <div className="mt-3 inline-flex rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                      {selectedDocument.status}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleGenerateSummary()}
                  disabled={generating || !documentId}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {generating ? "Generating..." : "Generate summary"}
                </button>
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  History
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Summary history
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review generated summaries and copy reusable results.
                </p>
              </div>

              <div className="min-w-[220px] space-y-2">
                <label
                  htmlFor="summary-filter-document"
                  className="text-sm font-semibold text-slate-700"
                >
                  Filter by document
                </label>

                <select
                  id="summary-filter-document"
                  value={filterDocumentId}
                  onChange={(event) => {
                    setFilterDocumentId(event.target.value);
                    setPage(1);
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">All documents</option>
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
                    className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : !hasSummaries ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                <p className="text-sm font-semibold text-slate-800">
                  No summaries yet
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create the first summary from a processed document.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {summaries.map((summary) => (
                    <article
                      key={summary.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                            {getSummaryTypeLabel(summary.summaryType)}
                          </p>

                          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950">
                            {summary.documentTitle}
                          </h3>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {summary.documentOriginalFilename}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              {summary.language}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {formatDate(summary.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                summary.content,
                                "Summary copied.",
                              )
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Copy
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(summary)}
                            className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {summary.promptStyle ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">
                            Prompt style:
                          </span>{" "}
                          {summary.promptStyle}
                        </div>
                      ) : null}

                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                        {truncateText(summary.content)}
                      </p>

                      <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
                        Model{" "}
                        <span className="font-medium text-slate-600">
                          {summary.createdByAiModel}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-500">
                    Page{" "}
                    <span className="font-semibold text-slate-800">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {pagination.totalPages}
                    </span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={pagination.page <= 1}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(pagination.totalPages, prev + 1),
                        )
                      }
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete summary?"
        description={
          deleteTarget
            ? `The summary for "${deleteTarget.documentTitle}" will be deleted.`
            : "This summary will be deleted."
        }
        confirmText="Delete summary"
        cancelText="Cancel"
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