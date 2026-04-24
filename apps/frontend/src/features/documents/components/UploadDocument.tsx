"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadDocument } from "../api/documents.api";

type UploadDocumentProps = {
  onUploaded?: () => Promise<void> | void;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadDocument({ onUploaded }: UploadDocumentProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file || loading) return;

    try {
      setLoading(true);
      await uploadDocument(file, title);

      setTitle("");
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await onUploaded?.();
      toast.success("Tải tài liệu lên thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Tải tài liệu thất bại.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Tải lên
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Thêm tài liệu
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tải tệp lên để hệ thống chuẩn bị dữ liệu cho tìm kiếm và chat.
            </p>
          </div>

          <span className="hidden shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline-flex">
            PDF · DOCX · TXT
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="document-title"
            className="text-sm font-semibold text-slate-700"
          >
            Tiêu đề
          </label>

          <input
            id="document-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nhập tiêu đề tài liệu nếu cần"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="document-file"
            className="text-sm font-semibold text-slate-700"
          >
            Tệp tài liệu
          </label>

          <label
            htmlFor="document-file"
            className="block cursor-pointer rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <input
              ref={inputRef}
              id="document-file"
              title="Chọn tệp tài liệu"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="sr-only"
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {file ? file.name : "Chọn một tài liệu"}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {file
                    ? `${formatFileSize(file.size)} · Sẵn sàng tải lên`
                    : "Hỗ trợ tệp PDF, DOCX hoặc TXT."}
                </p>
              </div>

              <span className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:w-auto">
                Chọn tệp
              </span>
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {loading ? "Đang tải lên..." : "Tải tài liệu lên"}
        </button>
      </div>
    </section>
  );
}