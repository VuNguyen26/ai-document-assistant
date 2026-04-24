"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDocumentById } from "@/features/documents/api/documents.api";
import type { DocumentDetailResponse } from "@/features/documents/types/documents.types";
import ChatBox from "./ChatBox";

type ChatDocumentPageViewProps = {
  documentId: string;
};

function getStatusStyle(status: string) {
  switch (status) {
    case "READY":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-100 bg-rose-50 text-rose-700";
    case "UPLOADED":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "EXTRACTED":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "CHUNKED":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    case "PROCESSING":
    case "VALIDATING":
    case "EXTRACTING":
    case "CHUNKING":
    case "EMBEDDING":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "DELETED":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "UPLOADED":
      return "Đã tải lên";
    case "PROCESSING":
      return "Đang xử lý";
    case "VALIDATING":
      return "Đang kiểm tra";
    case "EXTRACTING":
      return "Đang trích xuất";
    case "EXTRACTED":
      return "Đã trích xuất";
    case "CHUNKING":
      return "Đang chia đoạn";
    case "CHUNKED":
      return "Đã chia đoạn";
    case "EMBEDDING":
      return "Đang tạo embedding";
    case "READY":
      return "Sẵn sàng";
    case "FAILED":
      return "Thất bại";
    case "DELETED":
      return "Đã xóa";
    default:
      return status;
  }
}

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
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-9 w-72 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="h-[620px] animate-pulse rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="rounded-[2rem] border border-rose-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-rose-500" />

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Không thể mở chat tài liệu
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          {error || "Tài liệu này không tồn tại hoặc bạn không có quyền truy cập."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/documents"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Quay lại tài liệu
          </Link>

          <Link
            href={`/documents/${documentId}`}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Mở chi tiết
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/documents/${document.id}`}
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                ← Quay lại chi tiết
              </Link>

              <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                Chat tài liệu
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Chat với tài liệu
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Đặt câu hỏi dựa trên tệp đã tải lên. Câu trả lời sẽ bám sát nội
              dung tài liệu và hiển thị trích dẫn khi có nguồn phù hợp.
            </p>

            <div className="mt-5 min-w-0 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="truncate text-base font-semibold text-slate-950">
                {document.title}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {document.originalFilename}
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Thông tin tài liệu
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-sm font-medium text-slate-500">
                  Trạng thái
                </span>

                <span
                  className={`inline-flex max-w-[130px] items-center justify-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${getStatusStyle(
                    document.status,
                  )}`}
                  title={getStatusLabel(document.status)}
                >
                  {getStatusLabel(document.status)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-sm font-medium text-slate-500">
                  Ngôn ngữ
                </span>

                <span className="truncate text-sm font-semibold text-slate-900">
                  {document.sourceLanguage || "Chưa xác định"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-sm font-medium text-slate-500">
                  Số trang
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {document.pageCount ?? "—"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <ChatBox documentId={documentId} />
    </div>
  );
}