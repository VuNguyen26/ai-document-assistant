'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDocuments } from '@/features/documents/api/documents.api';
import type { DocumentItem } from '@/features/documents/types/documents.types';
import {
  addDocumentToWorkspace,
  getWorkspaceById,
  removeDocumentFromWorkspace,
  updateWorkspace,
} from '../api/workspaces.api';
import type { WorkspaceDetail } from '../types/workspaces.types';

type WorkspaceDetailViewProps = {
  workspaceId: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function WorkspaceDetailView({
  workspaceId,
}: WorkspaceDetailViewProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentIdToAdd, setDocumentIdToAdd] = useState('');

  async function loadWorkspace() {
    const data = await getWorkspaceById(workspaceId);
    setWorkspace(data);
    setName(data.name);
    setDescription(data.description || '');
  }

  async function loadDocuments() {
    const data = await getDocuments({
      page: 1,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    setDocuments(data.items);
  }

  async function loadPageData() {
    try {
      setLoading(true);
      await Promise.all([loadWorkspace(), loadDocuments()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tải workspace',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, [workspaceId]);

  const availableDocuments = useMemo(() => {
    if (!workspace) return documents;

    const linkedIds = new Set(workspace.documents.map((doc) => doc.id));
    return documents.filter((doc) => !linkedIds.has(doc.id));
  }, [documents, workspace]);

  async function handleSaveMeta() {
    if (!name.trim()) {
      toast.error('Tên workspace không được để trống.');
      return;
    }

    try {
      setSavingMeta(true);

      const updated = await updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setWorkspace(updated);
      toast.success('Cập nhật workspace thành công.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Cập nhật workspace thất bại',
      );
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleAddDocument() {
    if (!documentIdToAdd) {
      toast.error('Anh cần chọn document để thêm.');
      return;
    }

    try {
      setAddingDocument(true);
      const updated = await addDocumentToWorkspace(workspaceId, {
        documentId: documentIdToAdd,
      });

      setWorkspace(updated);
      setDocumentIdToAdd('');
      toast.success('Đã thêm document vào workspace.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Thêm document vào workspace thất bại',
      );
    } finally {
      setAddingDocument(false);
    }
  }

  async function confirmRemoveDocument() {
    if (!removeTarget) return;

    try {
      setIsRemoving(true);
      const updated = await removeDocumentFromWorkspace(
        workspaceId,
        removeTarget.id,
      );

      setWorkspace(updated);
      setRemoveTarget(null);
      toast.success('Đã gỡ document khỏi workspace.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gỡ document thất bại',
      );
    } finally {
      setIsRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-4">
            <div className="h-12 w-48 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
            <div className="h-96 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">
              Không tìm thấy workspace
            </p>
            <Link
              href="/workspaces"
              className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Quay lại Workspaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap gap-3">
              <Link
                href="/workspaces"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Về Workspaces
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
  href={`/workspaces/${workspaceId}/chat`}
  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
>
  Chat workspace
</Link>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Workspace detail
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {workspace.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              {workspace.description || 'Không có mô tả'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Workspace metadata
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chỉnh sửa tên và mô tả của workspace.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="workspace-detail-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      id="workspace-detail-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="workspace-detail-description"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="workspace-detail-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSaveMeta()}
                    disabled={savingMeta}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {savingMeta ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>

                  <p className="text-xs text-slate-400">
                    Updated: {formatDate(workspace.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Add document
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn một document hiện có để thêm vào workspace này.
                  </p>
                </div>

                <div className="space-y-4">
                  <select
                    value={documentIdToAdd}
                    onChange={(e) => setDocumentIdToAdd(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Chọn document...</option>
                    {availableDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} — {doc.status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void handleAddDocument()}
                    disabled={addingDocument}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingDocument ? 'Đang thêm...' : 'Thêm document'}
                  </button>

                  {availableDocuments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Tất cả documents hiện có đã nằm trong workspace này.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Documents in workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Danh sách tài liệu đang được liên kết với workspace.
                </p>
              </div>

              {workspace.documents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    📄
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Workspace này chưa có document nào
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy thêm document từ cột bên trái.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workspace.documents.map((doc) => (
                    <article
                      key={doc.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {doc.title}
                          </h3>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {doc.originalFilename}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              {doc.status}
                            </span>
                            {doc.sourceLanguage ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                {doc.sourceLanguage}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              Updated {formatDate(doc.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Xem document
                          </Link>

                          {doc.status === 'READY' ? (
                            <Link
                              href={`/documents/${doc.id}/chat`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Chat
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              setRemoveTarget({
                                id: doc.id,
                                title: doc.title,
                              })
                            }
                            className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Gỡ khỏi workspace
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Gỡ document khỏi workspace?"
        description={`Document "${removeTarget?.title || ''}" sẽ bị gỡ khỏi workspace này.`}
        confirmText={isRemoving ? 'Đang gỡ...' : 'Gỡ document'}
        cancelText="Hủy"
        tone="danger"
        loading={isRemoving}
        onCancel={() => {
          if (isRemoving) return;
          setRemoveTarget(null);
        }}
        onConfirm={() => void confirmRemoveDocument()}
      />
    </>
  );
}