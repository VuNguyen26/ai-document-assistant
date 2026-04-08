"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteDocument, getDocuments } from "../api/documents.api";
import type { DocumentItem } from "../types/documents.types";
import DocumentsGrid from "./DocumentsGrid";
import DocumentsToolbar from "./DocumentsToolbar";
import UploadDocument from "./UploadDocument";

const PAGE_SIZE = 12;

export default function DocumentsPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await getDocuments(1, 100);
      setDocuments(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách tài liệu",
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteDocument(deleteTarget.id);
      toast.success("Đã xóa tài liệu.");
      setDeleteTarget(null);
      await loadDocuments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xóa tài liệu thất bại",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const stats = useMemo(() => {
    const total = documents.length;
    const ready = documents.filter((item) => item.status === "READY").length;
    const failed = documents.filter((item) => item.status === "FAILED").length;
    const processing = documents.filter((item) =>
      ["UPLOADED", "PROCESSING", "EXTRACTING", "CHUNKING", "EMBEDDING"].includes(
        item.status,
      ),
    ).length;

    return { total, ready, failed, processing };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesKeyword =
        !keyword ||
        document.title.toLowerCase().includes(keyword) ||
        document.originalFilename.toLowerCase().includes(keyword);

      const matchesStatus = status === "ALL" || document.status === status;

      return matchesKeyword && matchesStatus;
    });
  }, [documents, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));

  const paginatedDocuments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDocuments.slice(start, start + PAGE_SIZE);
  }, [filteredDocuments, page]);

  function handleResetFilters() {
    setSearch("");
    setStatus("ALL");
    setPage(1);
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4">
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ← Về Dashboard
                </Link>
              </div>

              <p className="text-sm font-medium text-slate-500">
                AI Document Assistant
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Documents Workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Quản lý tài liệu, theo dõi trạng thái xử lý và chuẩn bị dữ liệu cho
                chat grounded bằng AI.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Ready
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">
                  {stats.ready}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Processing
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-600">
                  {stats.processing}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Failed
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-600">
                  {stats.failed}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <UploadDocument onUploaded={loadDocuments} />
          </div>

          <div className="mb-6">
            <DocumentsToolbar
              search={search}
              status={status}
              total={documents.length}
              filteredCount={filteredDocuments.length}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onReset={handleResetFilters}
            />
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : (
            <>
              <DocumentsGrid
                documents={paginatedDocuments}
                onDelete={(documentId) => {
                  const target =
                    documents.find((doc) => doc.id === documentId) || null;
                  setDeleteTarget(target);
                }}
              />

              {filteredDocuments.length > PAGE_SIZE ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
                    <span className="font-semibold text-slate-800">{totalPages}</span>
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ← Trước
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa tài liệu?"
        description={`Tài liệu "${deleteTarget?.title || ""}" sẽ bị xóa khỏi danh sách hiện tại.`}
        confirmText="Xóa tài liệu"
        cancelText="Hủy"
        tone="danger"
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}