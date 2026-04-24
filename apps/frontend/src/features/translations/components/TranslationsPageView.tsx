"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getDocuments } from "@/features/documents/api/documents.api";
import type { DocumentItem } from "@/features/documents/types/documents.types";
import { getSummaries } from "@/features/summaries/api/summaries.api";
import type { SummaryItem } from "@/features/summaries/types/summaries.types";
import {
  createTranslation,
  deleteTranslation,
  getTranslations,
} from "../api/translations.api";
import type {
  TranslationItem,
  TranslationSourceType,
  TranslationsListResponse,
} from "../types/translations.types";

const PAGE_SIZE = 10;

const SOURCE_TYPE_OPTIONS: Array<{
  value: TranslationSourceType;
  label: string;
}> = [
  { value: "DOCUMENT", label: "Document content" },
  { value: "SUMMARY", label: "Summary" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function truncateText(value: string, maxLength = 620) {
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

export default function TranslationsPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [pagination, setPagination] =
    useState<TranslationsListResponse["pagination"]>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TranslationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  const [documentId, setDocumentId] = useState("");
  const [sourceType, setSourceType] =
    useState<TranslationSourceType>("DOCUMENT");
  const [summaryId, setSummaryId] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [style, setStyle] = useState("");

  const [filterDocumentId, setFilterDocumentId] = useState("");
  const [filterSourceType, setFilterSourceType] = useState<
    TranslationSourceType | ""
  >("");
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

  async function loadSummaries(documentIdValue: string) {
    if (!documentIdValue) {
      setSummaries([]);
      return;
    }

    try {
      setLoadingSummaries(true);

      const data = await getSummaries({
        page: 1,
        limit: 100,
        documentId: documentIdValue,
      });

      setSummaries(data.items);
    } catch (error) {
      setSummaries([]);
      toast.error(
        error instanceof Error ? error.message : "Cannot load summaries.",
      );
    } finally {
      setLoadingSummaries(false);
    }
  }

  async function loadTranslations(
    nextPage = page,
    nextDocumentId = filterDocumentId,
    nextSourceType = filterSourceType,
  ) {
    try {
      setLoading(true);

      const data = await getTranslations({
        page: nextPage,
        limit: PAGE_SIZE,
        documentId: nextDocumentId || undefined,
        sourceType: nextSourceType || undefined,
      });

      setTranslations(data.items);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot load translations.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTranslation() {
    if (!documentId) {
      toast.error("Please select a document first.");
      return;
    }

    if (sourceType === "SUMMARY" && !summaryId) {
      toast.error("Please select a summary first.");
      return;
    }

    try {
      setGenerating(true);

      await createTranslation({
        documentId,
        sourceType,
        sourceId: sourceType === "SUMMARY" ? summaryId : undefined,
        sourceLanguage: sourceLanguage.trim() || undefined,
        targetLanguage: targetLanguage.trim() || "en",
        style: style.trim() || undefined,
      });

      toast.success("Translation created.");
      setPage(1);
      await loadTranslations(1, filterDocumentId, filterSourceType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot create translation.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function confirmDeleteTranslation() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteTranslation(deleteTarget.id);
      toast.success("Translation deleted.");
      setDeleteTarget(null);

      const nextPage =
        translations.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadTranslations(nextPage, filterDocumentId, filterSourceType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot delete translation.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    void loadTranslations(page, filterDocumentId, filterSourceType);
  }, [page, filterDocumentId, filterSourceType]);

  useEffect(() => {
    if (sourceType !== "SUMMARY") {
      setSummaryId("");
      setSummaries([]);
      return;
    }

    void loadSummaries(documentId);
  }, [sourceType, documentId]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === documentId) || null,
    [documents, documentId],
  );

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.id === summaryId) || null,
    [summaries, summaryId],
  );

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
                  Translation workspace
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Translate document content
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Create translations from full document content or previously
                  generated summaries, then reuse them from history.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                    TRN
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {pagination.total}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Total translations
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Saved translation records
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-xs font-semibold tracking-wide text-cyan-700 ring-1 ring-cyan-100">
                    SRC
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {documents.length}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Available sources
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Documents loaded for translation
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
                  New translation
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select the source, target language and output style.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="translation-document"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Document
                  </label>

                  <select
                    id="translation-document"
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
                      htmlFor="translation-source-type"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Source type
                    </label>

                    <select
                      id="translation-source-type"
                      value={sourceType}
                      onChange={(event) =>
                        setSourceType(
                          event.target.value as TranslationSourceType,
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    >
                      {SOURCE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="translation-target-language"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Target language
                    </label>

                    <input
                      id="translation-target-language"
                      value={targetLanguage}
                      onChange={(event) => setTargetLanguage(event.target.value)}
                      placeholder="en / vi / ja"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {sourceType === "SUMMARY" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="translation-summary"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Summary source
                    </label>

                    <select
                      id="translation-summary"
                      value={summaryId}
                      onChange={(event) => setSummaryId(event.target.value)}
                      disabled={!documentId || loadingSummaries}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {!documentId
                          ? "Select document first..."
                          : loadingSummaries
                            ? "Loading summaries..."
                            : "Select summary..."}
                      </option>

                      {summaries.map((summary) => (
                        <option key={summary.id} value={summary.id}>
                          {summary.summaryType} — {summary.language} —{" "}
                          {formatDate(summary.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <label
                      htmlFor="translation-source-language"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Source language
                    </label>

                    <input
                      id="translation-source-language"
                      value={sourceLanguage}
                      onChange={(event) =>
                        setSourceLanguage(event.target.value)
                      }
                      placeholder="Optional"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="translation-style"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Style
                    </label>

                    <input
                      id="translation-style"
                      value={style}
                      onChange={(event) => setStyle(event.target.value)}
                      placeholder="Natural, formal, concise..."
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {selectedDocument ? (
                  <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {selectedDocument.title}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {selectedDocument.originalFilename}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                        {selectedDocument.status}
                      </span>

                      {selectedSummary ? (
                        <span className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                          {selectedSummary.summaryType} ·{" "}
                          {selectedSummary.language}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleGenerateTranslation()}
                  disabled={
                    generating ||
                    !documentId ||
                    (sourceType === "SUMMARY" && !summaryId)
                  }
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {generating ? "Generating..." : "Generate translation"}
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
                  Translation history
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review generated translations and copy reusable output.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                <div className="space-y-2 sm:w-72">
                  <label
                    htmlFor="translation-filter-document"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Filter by document
                  </label>

                  <select
                    id="translation-filter-document"
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

                <div className="space-y-2 sm:w-56">
                  <label
                    htmlFor="translation-filter-source-type"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Filter by source
                  </label>

                  <select
                    id="translation-filter-source-type"
                    value={filterSourceType}
                    onChange={(event) => {
                      setFilterSourceType(
                        (event.target.value as TranslationSourceType | "") ||
                          "",
                      );
                      setPage(1);
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">All sources</option>
                    {SOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
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
            ) : translations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                <p className="text-sm font-semibold text-slate-800">
                  No translations yet
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create the first translation from a document or summary.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {translations.map((translation) => (
                    <article
                      key={translation.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                            {translation.sourceLabel}
                          </p>

                          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950">
                            {translation.documentTitle}
                          </h3>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {translation.documentOriginalFilename}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              {translation.sourceLanguage} →{" "}
                              {translation.targetLanguage}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {formatDate(translation.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                translation.content,
                                "Translation copied.",
                              )
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Copy
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(translation)}
                            className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {translation.style ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">
                            Style:
                          </span>{" "}
                          {translation.style}
                        </div>
                      ) : null}

                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                        {truncateText(translation.content)}
                      </p>

                      <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
                        Model{" "}
                        <span className="font-medium text-slate-600">
                          {translation.createdByAiModel}
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
        title="Delete translation?"
        description={
          deleteTarget
            ? `The translation for "${deleteTarget.documentTitle}" will be deleted.`
            : "This translation will be deleted."
        }
        confirmText="Delete translation"
        cancelText="Cancel"
        tone="danger"
        loading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteTranslation()}
      />
    </>
  );
}