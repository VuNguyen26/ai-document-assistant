"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const SUMMARY_CARDS = [
  {
    key: "total",
    label: "Tổng số",
    description: "Tất cả tệp",
    badge: "DOC",
    valueClassName: "text-slate-950",
    badgeClassName: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    dotClassName: "bg-indigo-500",
  },
  {
    key: "ready",
    label: "Sẵn sàng",
    description: "Có thể dùng để chat",
    badge: "RDY",
    valueClassName: "text-emerald-600",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dotClassName: "bg-emerald-500",
  },
  {
    key: "incomplete",
    label: "Chưa hoàn tất",
    description: "Đang xử lý",
    badge: "WIP",
    valueClassName: "text-amber-600",
    badgeClassName: "bg-amber-50 text-amber-700 ring-amber-100",
    dotClassName: "bg-amber-500",
  },
  {
    key: "failed",
    label: "Thất bại",
    description: "Cần kiểm tra",
    badge: "ERR",
    valueClassName: "text-rose-600",
    badgeClassName: "bg-rose-50 text-rose-700 ring-rose-100",
    dotClassName: "bg-rose-500",
  },
] as const;

export default function DocumentsPageView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summary, setSummary] = useState<DocumentsListResponse["summary"]>({
    total: 0,
    ready: 0,
    failed: 0,
    incomplete: 0,
  });
  const [pagination, setPagination] = useState<
    DocumentsListResponse["pagination"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

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

  const loadDocuments = useCallback(
    async (
      nextPage = page,
      nextSearch = debouncedSearch,
      nextStatus = status,
      nextSortBy = sortBy,
      nextSortOrder = sortOrder,
    ) => {
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
    },
    [page, debouncedSearch, status, sortBy, sortOrder],
  );

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteDocument(deleteTarget.id);
      toast.success("Đã xóa tài liệu.");
      setDeleteTarget(null);

      const targetPage = documents.length === 1 && page > 1 ? page - 1 : page;

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
    void loadDocuments(page, debouncedSearch, status, sortBy, sortOrder);
  }, [loadDocuments, page, debouncedSearch, status, sortBy, sortOrder]);

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
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  ← Quay lại tổng quan
                </Link>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Thư viện tài liệu
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Quản lý tài liệu đã tải lên
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Tải tệp lên, xem trạng thái xử lý và chuẩn bị tài liệu cho tìm
                  kiếm, chat, tóm tắt và dịch thuật.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SUMMARY_CARDS.map((item) => {
                const value = summary[item.key];

                return (
                  <div
                    key={item.key}
                    className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-semibold tracking-wide ring-1 ${item.badgeClassName}`}
                      >
                        {item.badge}
                      </div>

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`}
                      />
                    </div>

                    <p
                      className={`text-3xl font-semibold tracking-tight ${item.valueClassName}`}
                    >
                      {value}
                    </p>

                    <h3 className="mt-2 text-sm font-semibold text-slate-900">
                      {item.label}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
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

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                    Thư viện
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Danh sách tài liệu
                  </h2>
                </div>

                <p className="text-sm text-slate-500">
                  Trang{" "}
                  <span className="font-semibold text-slate-800">
                    {pagination.page}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-slate-800">
                    {pagination.totalPages}
                  </span>
                </p>
              </div>

              {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {documents.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                      <p className="text-sm font-semibold text-slate-800">
                        Không có tài liệu nào phù hợp
                      </p>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        {hasFilters
                          ? "Hãy thử đổi từ khóa, trạng thái hoặc kiểu sắp xếp."
                          : "Bạn có thể tải tài liệu đầu tiên lên để bắt đầu."}
                      </p>

                      {hasFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Xóa bộ lọc
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <DocumentsGrid
                        documents={documents}
                        onDelete={(documentId) => {
                          const target =
                            documents.find((item) => item.id === documentId) ||
                            null;
                          setDeleteTarget(target);
                        }}
                      />

                      <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                        <p className="text-sm text-slate-500">
                          Đang hiển thị{" "}
                          <span className="font-semibold text-slate-800">
                            {documents.length}
                          </span>{" "}
                          /{" "}
                          <span className="font-semibold text-slate-800">
                            {pagination.total}
                          </span>{" "}
                          tài liệu
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={pagination.page <= 1}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Trước
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPage((prev) =>
                                Math.min(pagination.totalPages, prev + 1),
                              )
                            }
                            disabled={pagination.page >= pagination.totalPages}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <UploadDocument
              onUploaded={async () => {
                setPage(1);
                await loadDocuments(
                  1,
                  debouncedSearch,
                  status,
                  sortBy,
                  sortOrder,
                );
              }}
            />

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Hướng dẫn trạng thái
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Trạng thái xử lý
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Sẵn sàng
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Tài liệu có thể dùng cho tìm kiếm và chat.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Chưa hoàn tất
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Hệ thống vẫn đang trích xuất, chia nhỏ nội dung hoặc tạo
                      embedding.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Thất bại
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Tệp cần được kiểm tra lại hoặc tải lên lại.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa tài liệu?"
        description={
          deleteTarget
            ? `Tài liệu "${deleteTarget.title}" sẽ bị xóa khỏi không gian làm việc.`
            : "Tài liệu này sẽ bị xóa khỏi không gian làm việc."
        }
        confirmText={isDeleting ? "Đang xóa..." : "Xóa tài liệu"}
        cancelText="Hủy"
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
