"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDocumentById } from "@/features/documents/api/documents.api";
import type { DocumentDetailResponse } from "@/features/documents/types/documents.types";
import ChatBox from "./ChatBox";

type ChatDocumentPageViewProps = {
  documentId: string;
};

export default function ChatDocumentPageView({
  documentId,
}: ChatDocumentPageViewProps) {
  const [document, setDocument] = useState<DocumentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        setError("");
        const data = await getDocumentById(documentId);
        setDocument(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin tài liệu.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 h-28 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="h-[calc(100vh-260px)] animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Không thể mở chat tài liệu
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {error || "Tài liệu không tồn tại hoặc anh không có quyền truy cập."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/documents"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại Documents
            </Link>

            <Link
              href={`/documents/${documentId}`}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Về Document Detail
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/documents/${document.id}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  ← Quay lại chi tiết tài liệu
                </Link>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  Document Chat
                </span>
              </div>

              <p className="text-sm font-medium text-slate-500">
                AI Document Assistant
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Chat với tài liệu
              </h1>
              <p className="mt-2 text-base font-semibold text-slate-800">
                {document.title}
              </p>
              <p className="mt-1 break-all text-sm text-slate-500">
                {document.originalFilename}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {document.status}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Language
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {document.sourceLanguage || "Chưa xác định"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Pages
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {document.pageCount ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ChatBox documentId={documentId} />
      </div>
    </div>
  );
}