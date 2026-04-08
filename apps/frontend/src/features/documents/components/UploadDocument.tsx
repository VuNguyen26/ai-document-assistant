"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadDocument } from "../api/documents.api";

type UploadDocumentProps = {
  onUploaded?: () => Promise<void> | void;
};

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
      toast.success("Upload tài liệu thành công.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Upload tài liệu mới
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hỗ trợ PDF, DOCX, TXT. Sau khi upload xong, tài liệu sẽ sẵn sàng cho
            pipeline AI của hệ thống.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          AI Document Assistant
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
        <div className="space-y-2">
          <label
            htmlFor="document-title"
            className="text-sm font-medium text-slate-700"
          >
            Tiêu đề
          </label>
          <input
            id="document-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Giáo trình Machine Learning chương 1"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="document-file"
            className="text-sm font-medium text-slate-700"
          >
            Chọn file
          </label>
          <input
            ref={inputRef}
            id="document-file"
            title="Chọn file tài liệu"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-[11px] text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {file ? (
            <p className="text-xs text-slate-500">
              Đã chọn:{" "}
              <span className="font-medium text-slate-700">{file.name}</span>
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="inline-flex h-[50px] items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Đang upload..." : "Upload ngay"}
        </button>
      </div>
    </section>
  );
}