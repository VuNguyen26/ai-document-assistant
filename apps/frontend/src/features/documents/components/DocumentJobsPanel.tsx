"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (!value) return "—";

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
      return "Đang chờ";
    case "RUNNING":
      return "Đang chạy";
    case "SUCCEEDED":
      return "Thành công";
    case "FAILED":
      return "Thất bại";
    case "RETRYING":
      return "Đang thử lại";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function getStatusClassName(status: DocumentProcessingJobStatus) {
  switch (status) {
    case "SUCCEEDED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "RUNNING":
    case "RETRYING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "QUEUED":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getTypeLabel(type: string) {
  return type === "REPROCESS" ? "Xử lý lại" : "Xử lý";
}

export default function DocumentJobsPanel({
  documentId,
  latestJob,
  documentStatus,
  onRefreshDocument,
}: DocumentJobsPanelProps) {
  const [jobs, setJobs] = useState<DocumentProcessingJob[]>([]);
  const [pagination, setPagination] =
    useState<DocumentJobsListResponse["pagination"]>({
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

  async function loadJobs(showLoading = true, silent = false) {
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
            : "Không thể tải lịch sử xử lý tài liệu",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadJobs(true);
  }, [documentId]);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = window.setInterval(() => {
      void loadJobs(false, true);
      void onRefreshDocument?.();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [shouldPoll, documentId, onRefreshDocument]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Tác vụ nền
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi pipeline tự động, xử lý, xử lý lại và thử lại của tài liệu
            này.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadJobs(false)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {refreshing ? "Đang làm mới..." : "Làm mới tác vụ"}
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            Tác vụ gần nhất:
          </span>

          {latestJob ? (
            <>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(
                  latestJob.status,
                )}`}
              >
                {getStatusLabel(latestJob.status)}
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {getTypeLabel(latestJob.type)}
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Lần thử {latestJob.attempts}/{latestJob.maxAttempts}
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500">
              Chưa có tác vụ nào
            </span>
          )}
        </div>

        {latestJob?.errorMessage ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {latestJob.errorMessage}
          </p>
        ) : null}

        {shouldPoll ? (
          <p className="mt-3 text-xs text-amber-700">
            Hệ thống đang tự làm mới mỗi 3 giây trong lúc tác vụ còn hoạt động.
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Chưa có lịch sử tác vụ
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Khi tải tài liệu mới, xử lý hoặc xử lý lại, hệ thống sẽ tạo tác vụ
            tại đây.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(
                          job.status,
                        )}`}
                      >
                        {getStatusLabel(job.status)}
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {getTypeLabel(job.type)}
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        Lần thử {job.attempts}/{job.maxAttempts}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>Ngày tạo: {formatDate(job.createdAt)}</p>
                      <p>Bắt đầu: {formatDate(job.startedAt)}</p>
                      <p>Hoàn tất: {formatDate(job.completedAt)}</p>
                      <p>Lần chạy tiếp theo: {formatDate(job.nextRunAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">
                    {job.id}
                  </div>
                </div>

                {job.errorMessage ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {job.errorMessage}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Đang hiển thị {jobs.length} / {pagination.total} tác vụ
          </div>
        </>
      )}
    </section>
  );
}