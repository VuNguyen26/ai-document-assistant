"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { getDocumentJobs } from "../api/document-jobs.api";
import type {
  DocumentJobsListResponse,
  DocumentProcessingJob,
  DocumentProcessingJobStatus,
} from "../types/document-jobs.types";
import { isDocumentJobActive } from "../types/document-jobs.types";

type DocumentJobsPanelProps = {
  documentId: string;
  latestJob?: DocumentProcessingJob | null;
  documentStatus?: string | null;
  onRefreshDocument?: () => Promise<void> | void;
};

const PAGE_SIZE = 10;

function formatDate(value?: string | null) {
  if (!value) return "\u2014";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: DocumentProcessingJobStatus) {
  switch (status) {
    case "QUEUED":
      return "\u0110ang ch\u1edd";
    case "RUNNING":
      return "\u0110ang ch\u1ea1y";
    case "SUCCEEDED":
      return "Th\xe0nh c\xf4ng";
    case "FAILED":
      return "Th\u1ea5t b\u1ea1i";
    case "RETRYING":
      return "\u0110ang th\u1eed l\u1ea1i";
    case "CANCELLED":
      return "\u0110\xe3 h\u1ee7y";
    default:
      return status;
  }
}

function getStatusClassName(status: DocumentProcessingJobStatus) {
  switch (status) {
    case "SUCCEEDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "RUNNING":
    case "RETRYING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "QUEUED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getTypeLabel(type: string) {
  return type === "REPROCESS" ? "X\u1eed l\xfd l\u1ea1i" : "X\u1eed l\xfd";
}

function getShortJobId(id: string) {
  return id.slice(0, 8);
}

export default function DocumentJobsPanel({
  documentId,
  latestJob,
  documentStatus,
  onRefreshDocument,
}: DocumentJobsPanelProps) {
  const [jobs, setJobs] = useState<DocumentProcessingJob[]>([]);
  const [pagination, setPagination] = useState<
    DocumentJobsListResponse["pagination"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shouldPoll = useMemo(() => {
    return documentStatus === "PROCESSING" || isDocumentJobActive(latestJob);
  }, [documentStatus, latestJob]);

  const loadJobs = useCallback(
    async (showLoading = true, silent = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await getDocumentJobs(documentId, {
          page: 1,
          limit: PAGE_SIZE,
        });

        setJobs(data.items);
        setPagination(data.pagination);
      } catch (error) {
        if (!silent) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Kh\xf4ng th\u1ec3 t\u1ea3i l\u1ecbch s\u1eed x\u1eed l\xfd t\xe0i li\u1ec7u",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [documentId],
  );

  useEffect(() => {
    void loadJobs(true);
  }, [loadJobs]);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = window.setInterval(() => {
      void loadJobs(false, true);
      void onRefreshDocument?.();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [shouldPoll, loadJobs, onRefreshDocument]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            {"L\u1ecbch s\u1eed x\u1eed l\xfd"}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
            {"T\xe1c v\u1ee5 n\u1ec1n"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {
              "Theo d\xf5i c\xe1c l\u1ea7n x\u1eed l\xfd v\xe0 th\u1eed l\u1ea1i c\u1ee7a t\xe0i li\u1ec7u."
            }
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadJobs(false)}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:text-slate-400"
        >
          {refreshing ? "\u0110ang l\xe0m m\u1edbi..." : "L\xe0m m\u1edbi"}
        </button>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              {"G\u1ea7n nh\u1ea5t"}
            </span>

            {latestJob ? (
              <>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
                    latestJob.status,
                  )}`}
                >
                  {getStatusLabel(latestJob.status)}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                  {getTypeLabel(latestJob.type)}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                  {"L\u1ea7n "}
                  {latestJob.attempts}/{latestJob.maxAttempts}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">
                {"Ch\u01b0a c\xf3 t\xe1c v\u1ee5"}
              </span>
            )}
          </div>

          {shouldPoll ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              {"T\u1ef1 l\xe0m m\u1edbi m\u1ed7i 3 gi\xe2y"}
            </span>
          ) : null}
        </div>

        {latestJob?.errorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
            {latestJob.errorMessage}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="divide-y divide-slate-200 px-5 sm:px-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="py-5">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {"Ch\u01b0a c\xf3 l\u1ecbch s\u1eed t\xe1c v\u1ee5"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {
              "C\xe1c l\u1ea7n x\u1eed l\xfd v\xe0 x\u1eed l\xfd l\u1ea1i s\u1ebd xu\u1ea5t hi\u1ec7n t\u1ea1i \u0111\xe2y."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            {jobs.map((job) => {
              const repeatsLatestError =
                job.id === latestJob?.id &&
                job.errorMessage === latestJob.errorMessage;

              return (
                <article
                  key={job.id}
                  className="px-5 py-4 transition hover:bg-slate-50/70 sm:px-6"
                >
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_110px] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
                            job.status,
                          )}`}
                        >
                          {getStatusLabel(job.status)}
                        </span>

                        <span className="text-xs font-medium text-slate-500">
                          {getTypeLabel(job.type)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        {"L\u1ea7n th\u1eed "}
                        {job.attempts}/{job.maxAttempts}
                      </p>
                    </div>

                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {"T\u1ea1o l\xfac"}
                        </dt>
                        <dd className="mt-1 text-slate-600">
                          {formatDate(job.createdAt)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {"Ho\xe0n t\u1ea5t"}
                        </dt>
                        <dd className="mt-1 text-slate-600">
                          {formatDate(job.completedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="lg:text-right">
                      <span
                        title={job.id}
                        className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-500"
                      >
                        #{getShortJobId(job.id)}
                      </span>
                    </div>
                  </div>

                  {job.errorMessage && !repeatsLatestError ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                      {job.errorMessage}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-400 sm:px-6">
            <span>
              {"Hi\u1ec3n th\u1ecb "}
              {jobs.length}/{pagination.total} {"t\xe1c v\u1ee5"}
            </span>
            <span>
              {"T\u1ed1i \u0111a "}
              {PAGE_SIZE} {"b\u1ea3n ghi"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
