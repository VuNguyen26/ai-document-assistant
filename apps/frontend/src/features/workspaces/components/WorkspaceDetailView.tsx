"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getDocuments } from "@/features/documents/api/documents.api";
import type { DocumentItem } from "@/features/documents/types/documents.types";
import {
  addDocumentToWorkspace,
  getWorkspaceById,
  removeDocumentFromWorkspace,
  updateWorkspace,
} from "../api/workspaces.api";
import type { WorkspaceDetail } from "../types/workspaces.types";

type WorkspaceDetailViewProps = {
  workspaceId: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [documentIdToAdd, setDocumentIdToAdd] = useState("");

  async function loadWorkspace() {
    const data = await getWorkspaceById(workspaceId);
    setWorkspace(data);
    setName(data.name);
    setDescription(data.description || "");
  }

  async function loadDocuments() {
    const data = await getDocuments({
      page: 1,
      limit: 100,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    setDocuments(data.items);
  }

  async function loadPageData() {
    try {
      setLoading(true);
      await Promise.all([loadWorkspace(), loadDocuments()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot load workspace.",
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
      toast.error("Workspace name is required.");
      return;
    }

    try {
      setSavingMeta(true);

      const updated = await updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setWorkspace(updated);
      toast.success("Workspace updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot update workspace.",
      );
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleAddDocument() {
    if (!documentIdToAdd) {
      toast.error("Please select a document first.");
      return;
    }

    try {
      setAddingDocument(true);

      const updated = await addDocumentToWorkspace(workspaceId, {
        documentId: documentIdToAdd,
      });

      setWorkspace(updated);
      setDocumentIdToAdd("");
      toast.success("Document added to workspace.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Cannot add document to workspace.",
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
      toast.success("Document removed from workspace.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot remove document.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-10 w-80 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-rose-500" />

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Workspace not found
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          This workspace does not exist or you do not have access.
        </p>

        <Link
          href="/workspaces"
          className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Back to workspaces
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/workspaces"
                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    ← Back to workspaces
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Dashboard
                  </Link>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Workspace detail
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {workspace.name}
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {workspace.description ||
                    "Manage metadata and documents linked to this workspace."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/workspaces/${workspaceId}/chat`}
                    className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    Chat workspace
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById(
                        "workspace-documents",
                      );
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    View documents
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                    DOC
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.documentsCount}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Documents
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Linked files
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    RDY
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.readyDocumentsCount}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Ready
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Available for chat
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xs font-semibold tracking-wide text-amber-700 ring-1 ring-amber-100">
                    WIP
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.incompleteDocumentsCount}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Incomplete
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Needs processing
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
                  Metadata
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Workspace information
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Update the name and description shown across the workspace.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="workspace-detail-name"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Name
                  </label>

                  <input
                    id="workspace-detail-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="workspace-detail-description"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="workspace-detail-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveMeta()}
                  disabled={savingMeta}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {savingMeta ? "Saving..." : "Save changes"}
                </button>

                <p className="text-xs text-slate-400">
                  Updated{" "}
                  <span className="font-medium text-slate-600">
                    {formatDate(workspace.updatedAt)}
                  </span>
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  Documents
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Add document
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Link an existing document to this workspace.
                </p>
              </div>

              <div className="space-y-4">
                <select
                  value={documentIdToAdd}
                  onChange={(event) => setDocumentIdToAdd(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">Select document...</option>
                  {availableDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} — {doc.status}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void handleAddDocument()}
                  disabled={addingDocument || !documentIdToAdd}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {addingDocument ? "Adding..." : "Add document"}
                </button>

                {availableDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                    All available documents are already linked to this
                    workspace.
                  </div>
                ) : null}
              </div>
            </section>
          </aside>

          <section
            id="workspace-documents"
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  Library
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Documents in workspace
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review linked documents, open individual details or start a
                  focused document chat.
                </p>
              </div>

              <Link
                href={`/workspaces/${workspaceId}/chat`}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Chat workspace
              </Link>
            </div>

            {workspace.documents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                <p className="text-sm font-semibold text-slate-800">
                  No documents linked
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add a document from the panel on the left to start using this
                  workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {workspace.documents.map((doc) => (
                  <article
                    key={doc.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                          Document
                        </p>

                        <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950">
                          {doc.title}
                        </h3>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {doc.originalFilename}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              doc.status,
                            )}`}
                          >
                            {doc.status}
                          </span>

                          {doc.sourceLanguage ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {doc.sourceLanguage}
                            </span>
                          ) : null}

                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Updated {formatDate(doc.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Detail
                        </Link>

                        {doc.status === "READY" ? (
                          <Link
                            href={`/documents/${doc.id}/chat`}
                            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
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
                          className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove document?"
        description={`Document "${removeTarget?.title || ""}" will be removed from this workspace.`}
        confirmText={isRemoving ? "Removing..." : "Remove document"}
        cancelText="Cancel"
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