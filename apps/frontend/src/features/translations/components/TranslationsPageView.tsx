'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDocuments } from '@/features/documents/api/documents.api';
import type { DocumentItem } from '@/features/documents/types/documents.types';
import { getSummaries } from '@/features/summaries/api/summaries.api';
import type { SummaryItem } from '@/features/summaries/types/summaries.types';
import {
  createTranslation,
  deleteTranslation,
  getTranslations,
} from '../api/translations.api';
import type {
  TranslationItem,
  TranslationSourceType,
  TranslationsListResponse,
} from '../types/translations.types';

const PAGE_SIZE = 10;

const SOURCE_TYPE_OPTIONS: Array<{
  value: TranslationSourceType;
  label: string;
}> = [
  { value: 'DOCUMENT', label: 'Document content' },
  { value: 'SUMMARY', label: 'Summary' },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error('Không thể copy vào clipboard.');
  }
}

export default function TranslationsPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [pagination, setPagination] =
    useState<TranslationsListResponse['pagination']>({
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

  const [documentId, setDocumentId] = useState('');
  const [sourceType, setSourceType] =
    useState<TranslationSourceType>('DOCUMENT');
  const [summaryId, setSummaryId] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [style, setStyle] = useState('');

  const [filterDocumentId, setFilterDocumentId] = useState('');
  const [filterSourceType, setFilterSourceType] = useState<
    TranslationSourceType | ''
  >('');
  const [page, setPage] = useState(1);

  async function loadDocuments() {
    const data = await getDocuments({
      page: 1,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    setDocuments(data.items);
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
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách summary',
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
        error instanceof Error ? error.message : 'Không thể tải translations',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTranslation() {
    if (!documentId) {
      toast.error('Anh cần chọn document trước.');
      return;
    }

    if (sourceType === 'SUMMARY' && !summaryId) {
      toast.error('Anh cần chọn summary trước khi dịch từ summary.');
      return;
    }

    try {
      setGenerating(true);

      await createTranslation({
        documentId,
        sourceType,
        sourceId: sourceType === 'SUMMARY' ? summaryId : undefined,
        sourceLanguage: sourceLanguage.trim() || undefined,
        targetLanguage: targetLanguage.trim() || 'en',
        style: style.trim() || undefined,
      });

      toast.success('Tạo translation thành công.');
      setPage(1);
      await loadTranslations(1, filterDocumentId, filterSourceType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Tạo translation thất bại',
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
      toast.success('Đã xóa translation.');
      setDeleteTarget(null);

      const nextPage =
        translations.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadTranslations(nextPage, filterDocumentId, filterSourceType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Xóa translation thất bại',
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
    if (sourceType !== 'SUMMARY') {
      setSummaryId('');
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
                Translations
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Dịch document content hoặc summary sang ngôn ngữ đích, lưu lại lịch sử để copy và tái sử dụng.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total translations
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
                  Generate translation
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Có thể dịch trực tiếp từ extracted content của document hoặc từ một summary đã tạo trước đó.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="translation-document"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Document
                  </label>
                  <select
                    id="translation-document"
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
                      htmlFor="translation-source-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Source type
                    </label>
                    <select
                      id="translation-source-type"
                      value={sourceType}
                      onChange={(e) =>
                        setSourceType(e.target.value as TranslationSourceType)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      {SOURCE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="translation-target-language"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Target language
                    </label>
                    <input
                      id="translation-target-language"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      placeholder="en / vi / ja..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                {sourceType === 'SUMMARY' ? (
                  <div>
                    <label
                      htmlFor="translation-summary"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Summary source
                    </label>
                    <select
                      id="translation-summary"
                      value={summaryId}
                      onChange={(e) => setSummaryId(e.target.value)}
                      disabled={!documentId || loadingSummaries}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {!documentId
                          ? 'Chọn document trước...'
                          : loadingSummaries
                            ? 'Đang tải summaries...'
                            : 'Chọn summary...'}
                      </option>
                      {summaries.map((summary) => (
                        <option key={summary.id} value={summary.id}>
                          {summary.summaryType} — {summary.language} —{' '}
                          {summary.createdAt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="translation-source-language"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Source language (optional)
                    </label>
                    <input
                      id="translation-source-language"
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      placeholder="Để trống để backend tự suy ra"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="translation-style"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Style (optional)
                    </label>
                    <input
                      id="translation-style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="Ví dụ: tự nhiên, chuyên nghiệp, ngắn gọn..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                {selectedDocument ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">
                      {selectedDocument.title}
                    </p>
                    <p className="mt-1">{selectedDocument.originalFilename}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status: {selectedDocument.status}
                    </p>

                    {selectedSummary ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Summary nguồn: {selectedSummary.summaryType} •{' '}
                        {selectedSummary.language}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleGenerateTranslation()}
                  disabled={generating}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {generating
                    ? 'Đang tạo translation...'
                    : 'Generate translation'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Translation history
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Lịch sử các bản dịch đã tạo từ document hoặc summary.
                  </p>
                </div>

                <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
                  <div className="sm:w-72">
                    <label
                      htmlFor="translation-filter-document"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Filter by document
                    </label>
                    <select
                      id="translation-filter-document"
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

                  <div className="sm:w-56">
                    <label
                      htmlFor="translation-filter-source-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Filter by source
                    </label>
                    <select
                      id="translation-filter-source-type"
                      value={filterSourceType}
                      onChange={(e) => {
                        setFilterSourceType(
                          (e.target.value as TranslationSourceType | '') || '',
                        );
                        setPage(1);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Tất cả nguồn</option>
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
                      className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              ) : translations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    🌐
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa có translation nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy tạo bản dịch đầu tiên từ document content hoặc summary.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {translations.map((translation) => (
                      <article
                        key={translation.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {translation.documentTitle}
                            </h3>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {translation.documentOriginalFilename}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {translation.sourceLabel}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {translation.sourceLanguage} →{' '}
                                {translation.targetLanguage}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {formatDate(translation.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void copyToClipboard(
                                  translation.content,
                                  'Đã copy translation.',
                                )
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Copy
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(translation)}
                              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {translation.style ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                            Style: {translation.style}
                          </div>
                        ) : null}

                        <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
                          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                            {translation.content}
                          </pre>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Model: {translation.createdByAiModel}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
                    <p className="text-sm text-slate-500">
                      Trang{' '}
                      <span className="font-semibold text-slate-900">
                        {pagination.page}
                      </span>{' '}
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
        title="Xóa translation?"
        description={`Translation của tài liệu "${deleteTarget?.documentTitle || ''}" sẽ bị xóa khỏi lịch sử.`}
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa translation'}
        cancelText="Hủy"
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