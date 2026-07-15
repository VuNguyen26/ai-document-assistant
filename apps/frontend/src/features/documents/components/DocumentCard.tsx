"use client";

import { useRouter } from "next/navigation";

import type { DocumentItem } from "../types/documents.types";
import DocumentStatusBadge from "./DocumentStatusBadge";

type DocumentCardProps = {
  document: DocumentItem;
  onDelete: (documentId: string) => Promise<void> | void;
};

const ARROW = "\u2192";
const DOT = "\u2022";

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
  if (!value) return "\u2014";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "\u2014";

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

  return "FILE";
}

function getPipelineAction(status: string) {
  switch (status) {
    case "UPLOADED":
      return {
        label: "S\u1eb5n s\xe0ng \u0111\u1ec3 tr\xedch xu\u1ea5t",
        cta: "Ti\u1ebfp t\u1ee5c",
        tone: "text-amber-700",
      };
    case "EXTRACTED":
      return {
        label: "S\u1eb5n s\xe0ng \u0111\u1ec3 chia \u0111o\u1ea1n",
        cta: "Ti\u1ebfp t\u1ee5c",
        tone: "text-cyan-700",
      };
    case "CHUNKED":
      return {
        label: "S\u1eb5n s\xe0ng t\u1ea1o embedding",
        cta: "Ti\u1ebfp t\u1ee5c",
        tone: "text-indigo-700",
      };
    case "PROCESSING":
      return {
        label: "\u0110ang x\u1eed l\xfd n\u1ed9i dung",
        cta: "\u0110ang x\u1eed l\xfd",
        tone: "text-blue-700",
      };
    case "FAILED":
      return {
        label: "C\u1ea7n ki\u1ec3m tra l\u1ea1i",
        cta: "M\u1edf chi ti\u1ebft",
        tone: "text-rose-700",
      };
    case "READY":
      return {
        label: "S\u1eb5n s\xe0ng \u0111\u1ec3 h\u1ecfi \u0111\xe1p",
        cta: "B\u1eaft \u0111\u1ea7u chat",
        tone: "text-emerald-700",
      };
    default:
      return {
        label: "M\u1edf chi ti\u1ebft t\xe0i li\u1ec7u",
        cta: "Xem chi ti\u1ebft",
        tone: "text-slate-600",
      };
  }
}

function getJobStatusClass(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "bg-rose-50 text-rose-700";
    case "RUNNING":
    case "RETRYING":
      return "bg-amber-50 text-amber-700";
    case "QUEUED":
      return "bg-cyan-50 text-cyan-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getJobStatusLabel(status: string) {
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

export default function DocumentCard({
  document,
  onDelete,
}: DocumentCardProps) {
  const router = useRouter();
  const isReady = document.status === "READY";
  const isProcessing = document.status === "PROCESSING";
  const action = getPipelineAction(document.status);
  const fileType = getShortMimeType(document.mimeType);

  return (
    <article className="group px-5 py-5 transition hover:bg-slate-50/80 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_150px] lg:items-start lg:gap-x-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-[11px] font-bold tracking-wide text-indigo-700">
            {fileType}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DocumentStatusBadge status={document.status} />

              <span className="text-xs text-slate-400">
                {formatDate(document.createdAt)}
              </span>
            </div>

            <h3 className="mt-2 truncate text-base font-semibold tracking-tight text-slate-950 transition group-hover:text-indigo-700">
              {document.title || document.originalFilename}
            </h3>

            <p className="mt-1 truncate text-sm text-slate-500">
              {document.originalFilename}
            </p>

            {document.errorMessage ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-rose-600">
                {document.errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-1 lg:gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {"Dung l\u01b0\u1ee3ng"}
            </p>
            <p className="mt-1 font-semibold text-slate-700">
              {formatBytes(document.fileSize)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {"Ng\xf4n ng\u1eef"}
            </p>
            <p className="mt-1 truncate font-semibold text-slate-700">
              {document.sourceLanguage || "Ch\u01b0a x\xe1c \u0111\u1ecbnh"}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {"Quy tr\xecnh"}
          </p>

          <p className={`mt-1 text-sm font-semibold ${action.tone}`}>
            {action.label}
          </p>

          {document.latestJob ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${getJobStatusClass(
                  document.latestJob.status,
                )}`}
              >
                {getJobStatusLabel(document.latestJob.status)}
              </span>

              <span className="text-slate-400">{DOT}</span>

              <span className="text-slate-500">
                {document.latestJob.attempts}/{document.latestJob.maxAttempts}{" "}
                {"l\u1ea7n th\u1eed"}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              {"Ch\u01b0a c\xf3 job x\u1eed l\xfd"}
            </p>
          )}

          {document.latestJob ? (
            <p className="mt-2 truncate text-xs text-slate-400">
              {"C\u1eadp nh\u1eadt"}{" "}
              {formatDateTime(document.latestJob.updatedAt)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col">
          <button
            type="button"
            onClick={() => router.push(`/documents/${document.id}`)}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 lg:w-full"
          >
            {"Chi ti\u1ebft"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                isReady
                  ? `/documents/${document.id}/chat`
                  : `/documents/${document.id}`,
              )
            }
            disabled={isProcessing}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 lg:w-full"
          >
            <span>{action.cta}</span>
            {!isProcessing ? (
              <span className="ml-2" aria-hidden="true">
                {ARROW}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onDelete(document.id)}
            className="inline-flex min-h-9 w-full items-center justify-center text-sm font-semibold text-rose-600 transition hover:text-rose-700"
          >
            {"X\xf3a t\xe0i li\u1ec7u"}
          </button>
        </div>
      </div>
    </article>
  );
}
