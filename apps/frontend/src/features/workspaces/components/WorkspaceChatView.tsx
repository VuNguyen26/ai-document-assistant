"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
  streamChat,
} from "@/features/chat/api/chat.api";
import ChatCitations from "@/features/chat/components/ChatCitations";
import MarkdownMessage from "@/features/chat/components/MarkdownMessage";
import type { ChatMessage, ChatSession } from "@/features/chat/types/chat.types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { getWorkspaceById } from "../api/workspaces.api";
import type { WorkspaceDetail } from "../types/workspaces.types";

type WorkspaceChatViewProps = {
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

function formatTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Cannot copy to clipboard.");
  }
}

export default function WorkspaceChatView({
  workspaceId,
}: WorkspaceChatViewProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadWorkspace() {
    const data = await getWorkspaceById(workspaceId);
    setWorkspace(data);
  }

  async function loadSessions(selectLatest = false) {
    try {
      setLoadingSessions(true);

      const result = await getChatSessions({
        page: 1,
        limit: 50,
        workspaceId,
      });

      setSessions(result.data);

      if (result.data.length === 0) {
        setActiveSessionId(null);
        setMessages([]);
        return;
      }

      if (selectLatest || !activeSessionId) {
        setActiveSessionId(result.data[0].id);
      } else {
        const stillExists = result.data.some(
          (item) => item.id === activeSessionId,
        );

        if (!stillExists) {
          setActiveSessionId(result.data[0].id);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot load chat sessions.",
      );
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      setLoadingMessages(true);
      const data = await getChatMessages(sessionId);
      setMessages(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot load chat messages.",
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoadingWorkspace(true);
        await Promise.all([loadWorkspace(), loadSessions(true)]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Cannot load workspace chat.",
        );
      } finally {
        setLoadingWorkspace(false);
      }
    }

    void bootstrap();
  }, [workspaceId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  async function handleRenameSession(sessionId: string) {
    const nextTitle = renameValue.trim();

    if (!nextTitle) {
      toast.error("Please enter a session title.");
      return;
    }

    try {
      await renameChatSession(sessionId, {
        title: nextTitle,
      });

      setRenamingSessionId(null);
      setRenameValue("");
      toast.success("Session renamed.");
      await loadSessions(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot rename session.",
      );
    }
  }

  async function confirmDeleteSession() {
    if (!deleteTarget) return;

    try {
      setIsDeletingSession(true);
      await deleteChatSession(deleteTarget.id);
      toast.success("Session deleted.");

      if (activeSessionId === deleteTarget.id) {
        setActiveSessionId(null);
        setMessages([]);
      }

      setDeleteTarget(null);
      await loadSessions(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot delete session.",
      );
    } finally {
      setIsDeletingSession(false);
    }
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setQuestion("");
    setRenamingSessionId(null);
    setRenameValue("");
    toast.success("Ready for a new workspace chat.");
  }

  async function handleSendQuestion() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      toast.error("Please enter a question.");
      return;
    }

    if (!workspace) {
      toast.error("Workspace is not ready.");
      return;
    }

    if (workspace.readyDocumentsCount === 0) {
      toast.error("This workspace has no READY document for chat.");
      return;
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "USER",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMessageId = `temp-assistant-${Date.now()}`;

    const tempAssistantMessage: ChatMessage = {
      id: tempAssistantMessageId,
      role: "ASSISTANT",
      content: "",
      createdAt: new Date().toISOString(),
      citations: [],
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setQuestion("");
    setSending(true);

    try {
      await streamChat(
        {
          question: trimmedQuestion,
          workspaceId,
          sessionId: activeSessionId || undefined,
          topK: 5,
        },
        {
          onMeta: (meta) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantMessageId
                  ? {
                      ...message,
                      citations: meta.usedChunks,
                    }
                  : message,
              ),
            );
          },
          onDelta: ({ content }) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantMessageId
                  ? {
                      ...message,
                      content: `${message.content}${content}`,
                    }
                  : message,
              ),
            );
          },
          onDone: async ({ sessionId }) => {
            setActiveSessionId(sessionId);
            await loadSessions(false);
            await loadMessages(sessionId);
          },
          onError: ({ message }) => {
            toast.error(message || "Stream chat failed.");
          },
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot send question.",
      );

      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== tempUserMessage.id &&
            message.id !== tempAssistantMessageId,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  if (loadingWorkspace) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-10 w-80 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="h-[720px] animate-pulse rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
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

  const chatDisabled = sending || workspace.readyDocumentsCount === 0;

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/workspaces/${workspaceId}`}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  ← Back to workspace
                </Link>

                <Link
                  href="/workspaces"
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Workspaces
                </Link>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Workspace chat
              </div>

              <h1 className="mt-5 max-w-3xl truncate text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {workspace.name}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Ask questions across all READY documents in this workspace. The
                answer is grounded by semantic search results from linked files.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                    DOC
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.documentsCount}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Documents
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    RDY
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.readyDocumentsCount}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Ready
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xs font-semibold tracking-wide text-amber-700 ring-1 ring-amber-100">
                    WIP
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {workspace.incompleteDocumentsCount}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Incomplete
                </p>
              </div>
            </div>
          </div>
        </section>

        {workspace.readyDocumentsCount === 0 ? (
          <div className="rounded-[2rem] border border-amber-100 bg-amber-50 px-6 py-5 text-sm leading-6 text-amber-800">
            This workspace has no READY document. Process at least one linked
            document before starting workspace chat.
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid h-[calc(100vh-190px)] min-h-[680px] max-h-[860px] xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="hidden border-r border-slate-200 bg-white xl:flex xl:flex-col">
              <div className="border-b border-slate-200 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                    Conversations
                  </p>

                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                    Workspace sessions
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
                >
                  New chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingSessions ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[88px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-indigo-500" />

                    <p className="text-sm font-semibold text-slate-800">
                      No conversations yet
                    </p>

                    <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
                      Send your first question to create a workspace chat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map((session) => {
                      const isActive = session.id === activeSessionId;
                      const isRenaming = renamingSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`rounded-2xl border p-3 transition ${
                            isActive
                              ? "border-indigo-200 bg-indigo-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isRenaming ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(event) =>
                                  setRenameValue(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                                placeholder="New title"
                              />

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingSessionId(null);
                                    setRenameValue("");
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRenameSession(session.id)
                                  }
                                  className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setActiveSessionId(session.id)}
                                className="block w-full text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                      isActive
                                        ? "bg-indigo-500"
                                        : "bg-slate-300"
                                    }`}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                                      {session.title || "Untitled chat"}
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                      {formatDate(session.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </button>

                              <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingSessionId(session.id);
                                    setRenameValue(session.title || "");
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  Rename
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(session)}
                                  className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <div className="flex min-w-0 flex-col bg-slate-50/60">
              <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Multi-document chat
                    </div>

                    <h2 className="mt-3 truncate text-xl font-semibold tracking-tight text-slate-950">
                      {activeSession?.title || "Workspace chat"}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Answers are generated from READY documents in this
                      workspace.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="inline-flex h-11 w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 xl:hidden"
                  >
                    New chat
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-24 animate-pulse rounded-3xl ${
                            index % 2 === 0
                              ? "ml-auto w-[70%] bg-indigo-100"
                              : "w-[82%] bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                      <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-indigo-500" />

                      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                        Start a workspace conversation
                      </h3>

                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                        Ask a question that may require information from more
                        than one document in this workspace.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isUser = message.role === "USER";
                      const citations = message.citations || [];
                      const time = formatTime(message.createdAt);

                      return (
                        <article
                          key={message.id}
                          className={`flex ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[88%] rounded-[1.5rem] px-5 py-4 shadow-sm ${
                              isUser
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-200 bg-white text-slate-900"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    isUser ? "bg-indigo-200" : "bg-emerald-500"
                                  }`}
                                />

                                <p
                                  className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                                    isUser ? "text-indigo-100" : "text-slate-400"
                                  }`}
                                >
                                  {isUser ? "You" : "Assistant"}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                {time ? (
                                  <span
                                    className={`text-xs ${
                                      isUser
                                        ? "text-indigo-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {time}
                                  </span>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyToClipboard(
                                      message.content,
                                      isUser
                                        ? "Question copied."
                                        : "Answer copied.",
                                    )
                                  }
                                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                                    isUser
                                      ? "bg-white/10 text-white hover:bg-white/15"
                                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {isUser ? (
                              <p className="whitespace-pre-wrap break-words text-sm leading-7">
                                {message.content}
                              </p>
                            ) : (
                              <div className="space-y-4">
                                <MarkdownMessage
                                  content={
                                    message.content ||
                                    (sending ? "Assistant is writing..." : "")
                                  }
                                />

                                {citations.length > 0 ? (
                                  <ChatCitations citations={citations} />
                                ) : null}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}

                  {sending ? (
                    <article className="flex justify-start">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                          <span className="font-medium">
                            Assistant is writing...
                          </span>
                        </div>
                      </div>
                    </article>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                <div className="mx-auto w-full max-w-4xl">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-3 shadow-sm transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void handleSendQuestion();
                          }
                        }}
                        rows={1}
                        placeholder="Ask across all ready documents..."
                        disabled={workspace.readyDocumentsCount === 0 || sending}
                        className="max-h-44 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => void handleSendQuestion()}
                        disabled={chatDisabled || !question.trim()}
                        className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {sending ? "Sending" : "Send"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col justify-between gap-1 px-1 text-xs text-slate-400 sm:flex-row sm:items-center">
                    <span>
                      Context is retrieved from READY documents in this
                      workspace.
                    </span>
                    <span>{question.trim().length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete chat session?"
        description={`Session "${deleteTarget?.title || "Untitled chat"}" will be removed from this workspace chat history.`}
        confirmText="Delete session"
        cancelText="Cancel"
        tone="danger"
        loading={isDeletingSession}
        onCancel={() => {
          if (isDeletingSession) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteSession()}
      />
    </>
  );
}