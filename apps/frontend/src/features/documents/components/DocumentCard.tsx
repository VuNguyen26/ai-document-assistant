"use client";

import { useRouter } from "next/navigation";
import type { DocumentItem } from "../types/documents.types";
import DocumentStatusBadge from "./DocumentStatusBadge";

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

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getShortMimeType(value: string) {
  if (value.includes("pdf")) return "PDF";
  if (value.includes("wordprocessingml")) return "DOCX";
  if (value.includes("text")) return "TXT";

  return value;
}

function getPipelineAction(status: string) {
  switch (status) {
    case "UPLOADED":
      return {
        label: "Ready for extraction",
        tone: "amber" as const,
        cta: "Continue",
      };
    case "EXTRACTED":
      return {
        label: "Ready for chunking",
        tone: "cyan" as const,
        cta: "Continue",
      };
    case "CHUNKED":
      return {
        label: "Ready for embeddings",
        tone: "indigo" as const,
        cta: "Continue",
      };
    case "PROCESSING":
      return {
        label: "Processing is running",
        tone: "blue" as const,
        cta: "Processing",
      };
    case "FAILED":
      return {
        label: "Needs review",
        tone: "rose" as const,
        cta: "Open detail",
      };
    case "READY":
      return {
        label: "Ready for chat",
        tone: "emerald" as const,
        cta: "Start chat",
      };
    default:
      return {
        label: "Open document detail",
        tone: "slate" as const,
        cta: "View detail",
      };
  }
}

function getActionBoxClass(
  tone:
    | "amber"
    | "cyan"
    | "indigo"
    | "blue"
    | "rose"
    | "emerald"
    | "slate",
) {
  switch (tone) {
    case "amber":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "cyan":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "indigo":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    case "blue":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "rose":
      return "border-rose-100 bg-rose-50 text-rose-700";
    case "emerald":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getJobStatusClass(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-100 bg-rose-50 text-rose-700";
    case "RUNNING":
    case "RETRYING":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "QUEUED":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getJobStatusLabel(status: string) {
  switch (status) {
    case "QUEUED":
      return "Queued";
    case "RUNNING":
      return "Running";
    case "SUCCEEDED":
      return "Succeeded";
    case "FAILED":
      return "Failed";
    case "RETRYING":
      return "Retrying";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
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
    <article className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Document
          </p>

          <h3 className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
            {document.title}
          </h3>

          <p className="mt-1 truncate text-sm text-slate-500">
            {document.originalFilename}
          </p>
        </div>

        <div className="shrink-0">
          <DocumentStatusBadge status={document.status} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Type
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {getShortMimeType(document.mimeType)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Size
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatBytes(document.fileSize)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Language
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {document.sourceLanguage || "Unknown"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Created
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {formatDate(document.createdAt)}
          </p>
        </div>
      </div>

      {document.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {document.errorMessage}
        </div>
      ) : null}

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${getActionBoxClass(
          action.tone,
        )}`}
      >
        {action.label}
      </div>

      {document.latestJob ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Latest job
            </p>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getJobStatusClass(
                document.latestJob.status,
              )}`}
            >
              {getJobStatusLabel(document.latestJob.status)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {document.latestJob.type === "REPROCESS" ? "Reprocess" : "Process"}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {document.latestJob.attempts}/{document.latestJob.maxAttempts} attempts
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Updated{" "}
            <span className="font-medium text-slate-700">
              {formatDate(document.latestJob.updatedAt)}
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => router.push(`/documents/${document.id}`)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Detail
          </button>

          {isReady ? (
            <button
              type="button"
              onClick={() => router.push(`/documents/${document.id}/chat`)}
              className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              {action.cta}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/documents/${document.id}`)}
              disabled={isProcessing}
              className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {action.cta}
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(document.id)}
            className="col-span-2 rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}