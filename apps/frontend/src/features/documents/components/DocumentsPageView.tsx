"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteDocument, getDocuments } from "../api/documents.api";
import type {
  DocumentItem,
  DocumentsListResponse,
} from "../types/documents.types";
import DocumentsGrid from "./DocumentsGrid";
import DocumentsToolbar from "./DocumentsToolbar";
import UploadDocument from "./UploadDocument";

const PAGE_SIZE = 12;

export default function DocumentsPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summary, setSummary] = useState<DocumentsListResponse["summary"]>({
    total: 0,
    ready: 0,
    failed: 0,
    incomplete: 0,
  });
  const [pagination, setPagination] = useState<DocumentsListResponse["pagination"]>(
    {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    },
  );

  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "updatedAt" | "title" | "status"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  async function loadDocuments(
    nextPage = page,
    nextSearch = debouncedSearch,
    nextStatus = status,
    nextSortBy = sortBy,
    nextSortOrder = sortOrder,
  ) {
    try {
      setLoading(true);

      const data = await getDocuments({
        page: nextPage,
        limit: PAGE_SIZE,
        search: nextSearch,
        status: nextStatus,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      });

      setDocuments(data.items);
      setPagination(data.pagination);
      setSummary(data.summary);
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

      const targetPage =
        documents.length === 1 && page > 1 ? page - 1 : page;

      setPage(targetPage);
      await loadDocuments(
        targetPage,
        debouncedSearch,
        status,
        sortBy,
        sortOrder,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xóa tài liệu thất bại",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortBy, sortOrder]);

  useEffect(() => {
    loadDocuments(page, debouncedSearch, status, sortBy, sortOrder);
  }, [page, debouncedSearch, status, sortBy, sortOrder]);

  const hasFilters = useMemo(() => {
    return (
      debouncedSearch.length > 0 ||
      status !== "ALL" ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc"
    );
  }, [debouncedSearch, status, sortBy, sortOrder]);

  function handleResetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setStatus("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
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
                Quản lý tài liệu, theo dõi trạng thái xử lý và chuẩn bị dữ liệu
                cho chat grounded bằng AI.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {summary.total}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Ready
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">
                  {summary.ready}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Incomplete
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">
                  {summary.incomplete}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Failed
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-600">
                  {summary.failed}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <DocumentsToolbar
              search={searchInput}
              status={status}
              sortBy={sortBy}
              sortOrder={sortOrder}
              total={summary.total}
              filteredCount={pagination.total}
              onSearchChange={setSearchInput}
              onStatusChange={setStatus}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onReset={handleResetFilters}
            />

            <UploadDocument
              onUploaded={async () => {
                setPage(1);
                await loadDocuments(1, debouncedSearch, status, sortBy, sortOrder);
              }}
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
                documents={documents}
                onDelete={(documentId) => {
                  const target =
                    documents.find((item) => item.id === documentId) || null;
                  setDeleteTarget(target);
                }}
              />

              {documents.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                    📂
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Không có tài liệu nào phù hợp
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {hasFilters
                      ? "Hãy thử đổi từ khóa, trạng thái hoặc kiểu sắp xếp."
                      : "Anh có thể upload tài liệu đầu tiên để bắt đầu."}
                  </p>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
                  <p className="text-sm text-slate-500">
                    Trang{" "}
                    <span className="font-semibold text-slate-900">
                      {pagination.page}
                    </span>{" "}
                    / {pagination.totalPages}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={pagination.page <= 1}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang trước
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(pagination.totalPages, prev + 1),
                        )
                      }
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá tài liệu"
        description={`Bạn có chắc muốn xoá tài liệu "${
          deleteTarget?.title || ""
        }" không? Hành động này sẽ ẩn tài liệu khỏi workspace hiện tại.`}
        confirmText="Xoá tài liệu"
        cancelText="Huỷ"
        tone="danger"
        loading={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
      />
    </>
  );
}