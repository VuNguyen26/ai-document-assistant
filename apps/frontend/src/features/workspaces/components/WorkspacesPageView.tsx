'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
} from '../api/workspaces.api';
import type {
  WorkspaceItem,
  WorkspacesListResponse,
} from '../types/workspaces.types';

const PAGE_SIZE = 10;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function WorkspacesPageView() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [pagination, setPagination] =
    useState<WorkspacesListResponse['pagination']>({
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
        error instanceof Error ? error.message : 'Không thể tải workspaces',
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
    setName('');
    setDescription('');
  }

  function startEdit(workspace: WorkspaceItem) {
    setEditingWorkspaceId(workspace.id);
    setName(workspace.name);
    setDescription(workspace.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmitWorkspace() {
    if (!name.trim()) {
      toast.error('Anh cần nhập tên workspace.');
      return;
    }

    try {
      setSubmitting(true);

      if (editingWorkspaceId) {
        await updateWorkspace(editingWorkspaceId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success('Cập nhật workspace thành công.');
      } else {
        await createWorkspace({
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success('Tạo workspace thành công.');
      }

      resetForm();
      setPage(1);
      await loadWorkspaces(1, search);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Thao tác workspace thất bại',
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
      toast.success('Đã xóa workspace.');
      setDeleteTarget(null);

      const nextPage =
        workspaces.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadWorkspaces(nextPage, search);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Xóa workspace thất bại',
      );
    } finally {
      setIsDeleting(false);
    }
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
                Workspaces
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Gom nhiều tài liệu vào cùng một workspace để chuẩn bị cho workflow multi-document về sau.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total workspaces
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {pagination.total}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingWorkspaceId ? 'Edit workspace' : 'Create workspace'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tạo nhóm tài liệu để quản lý theo chủ đề, dự án hoặc workflow.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Workspace name
                  </label>
                  <input
                    id="workspace-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Product spec Q2, Legal docs, Sales deck..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="workspace-description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="workspace-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Mô tả ngắn về mục đích của workspace..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSubmitWorkspace()}
                    disabled={submitting}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {submitting
                      ? editingWorkspaceId
                        ? 'Đang cập nhật...'
                        : 'Đang tạo...'
                      : editingWorkspaceId
                        ? 'Cập nhật workspace'
                        : 'Tạo workspace'}
                  </button>

                  {editingWorkspaceId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Hủy edit
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Workspace list
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Quản lý workspace và mở từng workspace để add/remove tài liệu.
                  </p>
                </div>

                <div className="flex w-full gap-3 lg:w-auto">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo tên hoặc mô tả..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:w-80"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSearch(searchInput.trim());
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Tìm
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              ) : workspaces.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    🗂️
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa có workspace nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Tạo workspace đầu tiên để gom nhiều documents vào cùng một chỗ.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {workspaces.map((workspace) => (
                      <article
                        key={workspace.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {workspace.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {workspace.description || 'Không có mô tả'}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {workspace.documentsCount} documents
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {workspace.readyDocumentsCount} ready
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {workspace.incompleteDocumentsCount} incomplete
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/workspaces/${workspace.id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Mở workspace
                            </Link>

                            <button
                              type="button"
                              onClick={() => startEdit(workspace)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(workspace)}
                              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {workspace.documentsPreview.length > 0 ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-medium text-slate-700">
                              Preview documents
                            </p>
                            <div className="space-y-2">
                              {workspace.documentsPreview.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                      {doc.title}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                      {doc.originalFilename}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                    {doc.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <p className="mt-3 text-xs text-slate-400">
                          Updated: {formatDate(workspace.updatedAt)}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
                    <p className="text-sm text-slate-500">
                      Trang{' '}
                      <span className="font-semibold text-slate-900">
                        {pagination.page}
                      </span>{' '}
                      / {pagination.totalPages}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={pagination.page <= 1}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa workspace?"
        description={`Workspace "${deleteTarget?.name || ''}" sẽ bị xóa cùng toàn bộ liên kết documents bên trong.`}
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa workspace'}
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