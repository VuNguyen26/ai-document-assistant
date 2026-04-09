"use client";

import { useRouter } from "next/navigation";
import DocumentStatusBadge from "./DocumentStatusBadge";
import type { DocumentItem } from "../types/documents.types";

type DocumentCardProps = {
  document: DocumentItem;
  onDelete: (documentId: string) => Promise<void> | void;
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

function getPipelineAction(status: string) {
  switch (status) {
    case "UPLOADED":
      return {
        label: "Bước tiếp theo: Extract",
        tone: "amber" as const,
        cta: "Tiếp tục xử lý",
      };
    case "EXTRACTED":
      return {
        label: "Bước tiếp theo: Chunk",
        tone: "sky" as const,
        cta: "Tiếp tục xử lý",
      };
    case "CHUNKED":
      return {
        label: "Bước tiếp theo: Embed",
        tone: "indigo" as const,
        cta: "Tiếp tục xử lý",
      };
    case "PROCESSING":
      return {
        label: "Tài liệu đang được xử lý",
        tone: "blue" as const,
        cta: "Đang xử lý",
      };
    case "FAILED":
      return {
        label: "Pipeline lỗi, nên reprocess",
        tone: "rose" as const,
        cta: "Mở chi tiết",
      };
    case "READY":
      return {
        label: "Đã sẵn sàng để chat",
        tone: "emerald" as const,
        cta: "Chat ngay",
      };
    default:
      return {
        label: "Mở chi tiết tài liệu",
        tone: "slate" as const,
        cta: "Xem chi tiết",
      };
  }
}

function getActionBoxClass(tone: "amber" | "sky" | "indigo" | "blue" | "rose" | "emerald" | "slate") {
  switch (tone) {
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "indigo":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function DocumentCard({
  document,
  onDelete,
}: DocumentCardProps) {
  const router = useRouter();
  const isReady = document.status === "READY";
  const isProcessing = document.status === "PROCESSING";
  const action = getPipelineAction(document.status);

  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {document.title}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500">
            {document.originalFilename}
          </p>
        </div>

        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Loại</p>
          <p className="mt-1 break-words font-medium text-slate-700">
            {document.mimeType}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Kích thước
          </p>
          <p className="mt-1 font-medium text-slate-700">
            {formatBytes(document.fileSize)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Ngôn ngữ
          </p>
          <p className="mt-1 font-medium text-slate-700">
            {document.sourceLanguage || "Chưa xác định"}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Tạo lúc
          </p>
          <p className="mt-1 font-medium text-slate-700">
            {formatDate(document.createdAt)}
          </p>
        </div>
      </div>

      {document.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {document.errorMessage}
        </div>
      ) : null}

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${getActionBoxClass(
          action.tone,
        )}`}
      >
        {action.label}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/documents/${document.id}`)}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Xem chi tiết
        </button>

        {isReady ? (
          <button
            type="button"
            onClick={() => router.push(`/documents/${document.id}/chat`)}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {action.cta}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/documents/${document.id}`)}
            disabled={isProcessing}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {action.cta}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(document.id)}
          className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          Xóa
        </button>
      </div>
    </article>
  );
}