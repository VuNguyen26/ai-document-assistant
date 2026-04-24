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
        error instanceof Error ? error.message : "Cannot load workspaces.",
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
      toast.error("Please enter a workspace name.");
      return;
    }

    try {
      setSubmitting(true);

      if (editingWorkspaceId) {
        await updateWorkspace(editingWorkspaceId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success("Workspace updated.");
      } else {
        await createWorkspace({
          name: name.trim(),
          description: description.trim() || undefined,
        });

        toast.success("Workspace created.");
      }

      resetForm();
      setPage(1);
      await loadWorkspaces(1, search);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Workspace action failed.",
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
      toast.success("Workspace deleted.");
      setDeleteTarget(null);

      const nextPage = workspaces.length === 1 && page > 1 ? page - 1 : page;

      setPage(nextPage);
      await loadWorkspaces(nextPage, search);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot delete workspace.",
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
                  ← Back to dashboard
                </Link>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Workspace manager
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Organize document workspaces
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Group related documents into focused work areas for future
                  multi-document chat and processing workflows.
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
                  Total workspaces
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Saved workspace records
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
                  Current page
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Workspace list pagination
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
                  {editingWorkspaceId ? "Edit" : "Create"}
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  {editingWorkspaceId ? "Edit workspace" : "New workspace"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create a focused area for documents that belong to the same
                  topic, project or workflow.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="workspace-name"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Workspace name
                  </label>

                  <input
                    id="workspace-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Product specs, legal docs, sales deck..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="workspace-description"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="workspace-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    placeholder="Short note about this workspace..."
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
                        ? "Updating..."
                        : "Creating..."
                      : editingWorkspaceId
                        ? "Update workspace"
                        : "Create workspace"}
                  </button>

                  {editingWorkspaceId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Cancel
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
                  Library
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Workspace list
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage workspaces and open a workspace to attach or remove
                  documents.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 lg:w-[360px]">
                <label
                  htmlFor="workspace-search"
                  className="text-sm font-semibold text-slate-700"
                >
                  Search
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
                    placeholder="Search name or description"
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    Search
                  </button>
                </div>

                {search ? (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="w-fit text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
                  >
                    Clear search
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
                  No workspaces found
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another keyword or clear the search filter."
                    : "Create the first workspace to group related documents."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Clear search
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
                            Workspace
                          </p>

                          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950">
                            {workspace.name}
                          </h3>

                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            {workspace.description || "No description"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              {workspace.documentsCount} documents
                            </span>

                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {workspace.readyDocumentsCount} ready
                            </span>

                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              {workspace.incompleteDocumentsCount} incomplete
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/workspaces/${workspace.id}`}
                            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                          >
                            Open
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEdit(workspace)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(workspace)}
                            className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {workspace.documentsPreview.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              Preview documents
                            </p>

                            <Link
                              href={`/workspaces/${workspace.id}`}
                              className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                            >
                              Manage →
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
                                  {doc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
                        Updated{" "}
                        <span className="font-medium text-slate-600">
                          {formatDate(workspace.updatedAt)}
                        </span>
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-500">
                    Page{" "}
                    <span className="font-semibold text-slate-800">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
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
                      Previous
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
                      Next
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
        title="Delete workspace?"
        description={`Workspace "${deleteTarget?.name || ""}" and its document links will be removed.`}
        confirmText={isDeleting ? "Deleting..." : "Delete workspace"}
        cancelText="Cancel"
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