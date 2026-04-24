"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../api/workspaces.api";
import type {
  WorkspaceItem,
  WorkspacesListResponse,
} from "../types/workspaces.types";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDocumentStatusLabel(status: string) {
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

export default function WorkspacesPageView() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [pagination, setPagination] =
    useState<WorkspacesListResponse["pagination"]>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadWorkspaces(nextPage = page, nextSearch = search) {
    try {
      setLoading(true);

      const data = await getWorkspaces({
        page: nextPage,
        limit: PAGE_SIZE,
        search: nextSearch || undefined,
      });

      setWorkspaces(data.items);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách không gian làm việc.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspaces(page, search);
  }, [page, search]);

  function resetForm() {
    setEditingWorkspaceId(null);
    setName("");
    setDescription("");
  }

  function startEdit(workspace: WorkspaceItem) {
    setEditingWorkspaceId(workspace.id);
    setName(workspace.name);
    setDescription(workspace.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmitWorkspace() {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên không gian làm việc.");
      return;
    }

    try {
      setSubmitting(true);

      if (editingWorkspaceId) {
        await updateWorkspace(editingWorkspaceId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success("Đã cập nhật không gian làm việc.");
      } else {
        await createWorkspace({
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success("Đã tạo không gian làm việc.");
      }

      resetForm();
      setPage(1);
      await loadWorkspaces(1, search);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Thao tác với không gian làm việc thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteWorkspace() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteWorkspace(deleteTarget.id);
      toast.success("Đã xóa không gian làm việc.");
      setDeleteTarget(null);

      const nextPage = workspaces.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadWorkspaces(nextPage, search);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa không gian làm việc.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSearchSubmit() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleResetSearch() {
    setSearchInput("");
    setSearch("");
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
                  Quản lý không gian làm việc
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Sắp xếp tài liệu theo không gian làm việc
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Nhóm các tài liệu liên quan vào từng khu vực làm việc riêng để
                  phục vụ chat nhiều tài liệu và các quy trình xử lý sau này.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                    WSP
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {pagination.total}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Tổng không gian
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Không gian làm việc đã lưu
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-xs font-semibold tracking-wide text-cyan-700 ring-1 ring-cyan-100">
                    PAGE
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {pagination.page}/{pagination.totalPages}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Trang hiện tại
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Phân trang danh sách không gian
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  {editingWorkspaceId ? "Chỉnh sửa" : "Tạo mới"}
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  {editingWorkspaceId
                    ? "Chỉnh sửa không gian"
                    : "Không gian mới"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tạo một khu vực tập trung cho các tài liệu thuộc cùng chủ đề,
                  dự án hoặc quy trình làm việc.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="workspace-name"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Tên không gian
                  </label>

                  <input
                    id="workspace-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Thông số sản phẩm, tài liệu pháp lý, slide bán hàng..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="workspace-description"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Mô tả
                  </label>

                  <textarea
                    id="workspace-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    placeholder="Ghi chú ngắn về không gian làm việc này..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleSubmitWorkspace()}
                    disabled={submitting}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitting
                      ? editingWorkspaceId
                        ? "Đang cập nhật..."
                        : "Đang tạo..."
                      : editingWorkspaceId
                        ? "Cập nhật không gian"
                        : "Tạo không gian"}
                  </button>

                  {editingWorkspaceId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Hủy
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  Thư viện
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Danh sách không gian
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Quản lý không gian làm việc và mở từng không gian để thêm hoặc
                  gỡ tài liệu.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 lg:w-[360px]">
                <label
                  htmlFor="workspace-search"
                  className="text-sm font-semibold text-slate-700"
                >
                  Tìm kiếm
                </label>

                <div className="flex gap-2">
                  <input
                    id="workspace-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="Tìm theo tên hoặc mô tả"
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    Tìm
                  </button>
                </div>

                {search ? (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="w-fit text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                <p className="text-sm font-semibold text-slate-800">
                  Không tìm thấy không gian làm việc
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Hãy thử từ khóa khác hoặc xóa bộ lọc tìm kiếm."
                    : "Hãy tạo không gian làm việc đầu tiên để nhóm các tài liệu liên quan."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {workspaces.map((workspace) => (
                    <article
                      key={workspace.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                            Không gian làm việc
                          </p>

                          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950">
                            {workspace.name}
                          </h3>

                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            {workspace.description || "Chưa có mô tả"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              {workspace.documentsCount} tài liệu
                            </span>

                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {workspace.readyDocumentsCount} sẵn sàng
                            </span>

                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              {workspace.incompleteDocumentsCount} chưa hoàn tất
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/workspaces/${workspace.id}`}
                            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                          >
                            Mở
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEdit(workspace)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(workspace)}
                            className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      {workspace.documentsPreview.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              Tài liệu xem trước
                            </p>

                            <Link
                              href={`/workspaces/${workspace.id}`}
                              className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                            >
                              Quản lý →
                            </Link>
                          </div>

                          <div className="space-y-2">
                            {workspace.documentsPreview.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {doc.title}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {doc.originalFilename}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {getDocumentStatusLabel(doc.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
                        Cập nhật{" "}
                        <span className="font-medium text-slate-600">
                          {formatDate(workspace.updatedAt)}
                        </span>
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
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

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa không gian làm việc?"
        description={`Không gian "${
          deleteTarget?.name || ""
        }" và các liên kết tài liệu trong không gian này sẽ bị xóa.`}
        confirmText={isDeleting ? "Đang xóa..." : "Xóa không gian"}
        cancelText="Hủy"
        tone="danger"
        loading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteWorkspace()}
      />
    </>
  );
}