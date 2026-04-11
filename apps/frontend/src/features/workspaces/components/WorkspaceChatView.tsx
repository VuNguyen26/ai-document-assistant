'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
  streamChat,
} from '@/features/chat/api/chat.api';
import type {
  ChatCitation,
  ChatMessage,
  ChatSession,
} from '@/features/chat/types/chat.types';
import { getWorkspaceById } from '../api/workspaces.api';
import type { WorkspaceDetail } from '../types/workspaces.types';

type WorkspaceChatViewProps = {
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

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error('Không thể copy vào clipboard.');
  }
}

export default function WorkspaceChatView({
  workspaceId,
}: WorkspaceChatViewProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

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
        const stillExists = result.data.some((item) => item.id === activeSessionId);

        if (!stillExists) {
          setActiveSessionId(result.data[0].id);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tải chat sessions',
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
        error instanceof Error ? error.message : 'Không thể tải chat messages',
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
          error instanceof Error ? error.message : 'Không thể tải workspace chat',
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

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  async function handleRenameSession(session: ChatSession) {
    const nextTitle = window.prompt(
      'Nhập tên mới cho chat session',
      session.title || '',
    );

    if (!nextTitle || !nextTitle.trim()) return;

    try {
      await renameChatSession(session.id, {
        title: nextTitle.trim(),
      });

      toast.success('Đã đổi tên chat session.');
      await loadSessions(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Đổi tên chat session thất bại',
      );
    }
  }

  async function handleDeleteSession(session: ChatSession) {
    const confirmed = window.confirm(
      `Xóa chat session "${session.title || 'Untitled chat'}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteChatSession(session.id);
      toast.success('Đã xóa chat session.');

      if (activeSessionId === session.id) {
        setActiveSessionId(null);
        setMessages([]);
      }

      await loadSessions(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Xóa chat session thất bại',
      );
    }
  }

  async function handleSendQuestion() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      toast.error('Anh cần nhập câu hỏi.');
      return;
    }

    if (!workspace) {
      toast.error('Workspace chưa sẵn sàng.');
      return;
    }

    if (workspace.readyDocumentsCount === 0) {
      toast.error('Workspace chưa có document READY để chat.');
      return;
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'USER',
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMessageId = `temp-assistant-${Date.now()}`;

    const tempAssistantMessage: ChatMessage = {
      id: tempAssistantMessageId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
      citations: [],
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setQuestion('');
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
            toast.error(message || 'Stream chat thất bại.');
          },
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gửi câu hỏi thất bại',
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
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-4">
            <div className="h-12 w-48 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-3xl bg-white" />
            <div className="h-[600px] animate-pulse rounded-3xl bg-white" />
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap gap-3">
            <Link
              href={`/workspaces/${workspaceId}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Về Workspace
            </Link>

            <Link
              href="/workspaces"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Workspaces
            </Link>
          </div>

          <p className="text-sm font-medium text-slate-500">Workspace chat</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {workspace.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Chat trên toàn bộ documents trong workspace. Semantic search sẽ chạy trên các tài liệu READY nằm trong workspace này.
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

        {workspace.readyDocumentsCount === 0 ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
            Workspace này chưa có document READY. Anh hãy process ít nhất một tài liệu trước khi chat.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Sessions
                </h2>
                <p className="text-sm text-slate-500">
                  Chat history của workspace này
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSessionId(null);
                  setMessages([]);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Chat mới
              </button>
            </div>

            {loadingSessions ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm text-slate-600">Chưa có session nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setActiveSessionId(session.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-white'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">
                        {session.title || 'Untitled chat'}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {formatDate(session.updatedAt)}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRenameSession(session);
                          }}
                          className={`rounded-full px-2 py-1 text-[11px] ${
                            isActive
                              ? 'bg-slate-700 text-white'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          Rename
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteSession(session);
                          }}
                          className={`rounded-full px-2 py-1 text-[11px] ${
                            isActive
                              ? 'bg-rose-400/20 text-rose-100'
                              : 'bg-white text-rose-600'
                          }`}
                        >
                          Delete
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="flex min-h-[720px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                {activeSession?.title || 'Workspace chat'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Trả lời dựa trên các chunk được semantic search từ toàn bộ documents trong workspace.
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {loadingMessages ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-3xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                    💬
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Bắt đầu chat với workspace
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Đặt câu hỏi để truy xuất thông tin từ nhiều tài liệu trong cùng workspace.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isUser = message.role === 'USER';
                  const citations = message.citations || [];

                  return (
                    <article
                      key={message.id}
                      className={`rounded-3xl px-5 py-4 ${
                        isUser
                          ? 'ml-auto max-w-3xl bg-slate-900 text-white'
                          : 'max-w-4xl border border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          {isUser ? 'You' : 'Assistant'}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              message.content,
                              isUser
                                ? 'Đã copy câu hỏi.'
                                : 'Đã copy câu trả lời.',
                            )
                          }
                          className={`rounded-full px-3 py-1 text-xs ${
                            isUser
                              ? 'bg-white/10 text-white'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          Copy
                        </button>
                      </div>

                      <div className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.content || (sending && !isUser ? '...' : '')}
                      </div>

                      {citations.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Citations
                          </p>

                          {citations.map((citation: ChatCitation, index) => (
                            <div
                              key={citation.id || `${message.id}-${index}`}
                              className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2 py-1">
                                  {citation.documentName}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1">
                                  Chunk #{citation.chunkIndex}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1">
                                  Score {citation.score}
                                </span>
                              </div>

                              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
                                {citation.content}
                              </pre>

                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyToClipboard(
                                      citation.content,
                                      'Đã copy chunk.',
                                    )
                                  }
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                                >
                                  Copy chunk
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyToClipboard(
                                      `${citation.documentName} - Chunk ${citation.chunkIndex}\n\n${citation.content}`,
                                      'Đã copy citation.',
                                    )
                                  }
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                                >
                                  Copy citation
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-3">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  placeholder="Hỏi về toàn bộ tài liệu trong workspace này..."
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Context được lấy từ tất cả documents READY trong workspace.
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleSendQuestion()}
                    disabled={sending || workspace.readyDocumentsCount === 0}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {sending ? 'Đang trả lời...' : 'Gửi câu hỏi'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}