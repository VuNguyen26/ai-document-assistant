"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  chunkDocument,
  embedDocument,
  extractDocument,
  getDocumentById,
  getDocumentChunks,
} from "../api/documents.api";
import type {
  DocumentChunk,
  DocumentDetailResponse,
} from "../types/documents.types";

type DocumentDetailViewProps = {
  documentId: string;
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
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
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
    "extract" | "chunk" | "embed" | null
  >(null);
  const [error, setError] = useState("");

  async function loadDocument() {
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
  }

  async function runAction(type: "extract" | "chunk" | "embed") {
    try {
      setActionLoading(type);
      setError("");

      if (type === "extract") {
        await extractDocument(documentId);
        toast.success("Extract thành công.");
      } else if (type === "chunk") {
        await chunkDocument(documentId);
        toast.success("Chunk thành công.");
      } else {
        await embedDocument(documentId);
        toast.success("Embed thành công.");
      }

      await loadDocument();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Thao tác pipeline thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    loadDocument();
  }, [documentId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          </div>

          <div className="mt-6 h-96 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy tài liệu
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Tài liệu này có thể đã bị xóa hoặc anh không có quyền truy cập.
          </p>
          <button
            type="button"
            onClick={() => router.push("/documents")}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Quay lại Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/documents")}
              className="mb-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Quay lại Documents
            </button>

            <p className="text-sm font-medium text-slate-500">
              Document Detail
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {document.title}
            </h1>
            <p className="mt-2 max-w-3xl break-all text-sm text-slate-500">
              {document.originalFilename}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runAction("extract")}
              disabled={actionLoading !== null}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "extract" ? "Đang extract..." : "Extract"}
            </button>

            <button
              type="button"
              onClick={() => runAction("chunk")}
              disabled={actionLoading !== null}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "chunk" ? "Đang chunk..." : "Chunk"}
            </button>

            <button
              type="button"
              onClick={() => runAction("embed")}
              disabled={actionLoading !== null}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "embed" ? "Đang embed..." : "Embed"}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/documents/${document.id}/chat`)}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Chat với tài liệu
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Tổng quan tài liệu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Metadata và trạng thái hiện tại của document.
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                  document.status,
                )}`}
              >
                {document.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  MIME Type
                </p>
                <p className="mt-2 break-words text-sm font-medium text-slate-700">
                  {document.mimeType}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Kích thước
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {formatBytes(document.fileSize)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Ngôn ngữ
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {document.sourceLanguage || "Chưa xác định"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Số trang
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {document.pageCount ?? "Chưa có"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Tạo lúc
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {formatDate(document.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Cập nhật
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {formatDate(document.updatedAt)}
                </p>
              </div>
            </div>

            {document.errorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {document.errorMessage}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Pipeline trạng thái
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Điều khiển luồng extract → chunk → embed cho document này.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "1. Extract",
                  desc: "Trích xuất nội dung text từ file gốc.",
                  active: Boolean(extractedText),
                },
                {
                  title: "2. Chunk",
                  desc: "Chia document thành các chunk để retrieval.",
                  active: chunks.length > 0,
                },
                {
                  title: "3. Embed",
                  desc: "Sinh vector embedding để semantic search và chat.",
                  active:
                    document.status === "READY" ||
                    document.status === "EMBEDDING",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className={`rounded-2xl border p-4 ${
                    step.active
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        step.active
                          ? "bg-white text-emerald-700"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {step.active ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Chunk count
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {chunks.length}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Extracted Content
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Nội dung văn bản đã được hệ thống trích xuất từ tài liệu.
              </p>
            </div>

            {extractedText ? (
              <div className="max-h-[640px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                  {extractedText}
                </pre>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                  📄
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Chưa có extracted text
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Hãy chạy bước Extract để lấy nội dung tài liệu.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Chunks</h2>
              <p className="mt-1 text-sm text-slate-500">
                Các chunk hiện có dùng cho retrieval và chat grounded.
              </p>
            </div>

            {chunks.length > 0 ? (
              <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Chunk #{chunk.chunkIndex}
                      </span>
                      <span className="text-xs text-slate-500">
                        {chunk.charCount} ký tự
                      </span>
                    </div>

                    <p className="line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {chunk.content}
                    </p>

                    <div className="mt-3 flex gap-3 text-xs text-slate-400">
                      <span>start: {chunk.startOffset ?? "-"}</span>
                      <span>end: {chunk.endOffset ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                  ✂️
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Chưa có chunk nào
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Hãy chạy bước Chunk sau khi đã Extract.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}