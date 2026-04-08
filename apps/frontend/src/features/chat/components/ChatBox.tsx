"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
} from "../api/chat.api";
import { useChatStream } from "../hooks/useChatStream";
import type { ChatMessage, ChatSession } from "../types/chat.types";
import MarkdownMessage from "./MarkdownMessage";

type ChatBoxProps = {
  documentId: string;
};

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function createTempUserMessage(content: string): ChatMessage {
  return {
    id: `temp-user-${Date.now()}`,
    sessionId: "",
    role: "USER",
    content,
    createdAt: new Date().toISOString(),
  };
}

function createTempAssistantMessage(): ChatMessage {
  return {
    id: `temp-assistant-${Date.now()}`,
    sessionId: "",
    role: "ASSISTANT",
    content: "",
    createdAt: new Date().toISOString(),
  };
}

export default function ChatBox({ documentId }: ChatBoxProps) {
  const router = useRouter();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  const refreshSessions = useCallback(async () => {
    const data = await getChatSessions();
    setSessions(data);
    return data;
  }, []);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError(null);

    try {
      const data = await getChatMessages(sessionId);
      setMessages(data);
      setActiveSessionId(sessionId);
    } catch (err) {
      setError((err as Error).message || "Không tải được tin nhắn");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (isCheckingAuth) return;

    const init = async () => {
      setIsLoadingSessions(true);
      setError(null);

      try {
        const data = await refreshSessions();
        if (data.length > 0) {
          await loadSessionMessages(data[0].id);
        } else {
          setMessages([]);
          setActiveSessionId(null);
        }
      } catch (err) {
        setError((err as Error).message || "Không tải được danh sách chat");
      } finally {
        setIsLoadingSessions(false);
      }
    };

    void init();
  }, [refreshSessions, loadSessionMessages, isCheckingAuth]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  const { isStreaming, startStream } = useChatStream({
    onMeta: (meta) => {
      if (meta?.sessionId && !activeSessionId) {
        setActiveSessionId(String(meta.sessionId));
      }
    },
    onDelta: (delta) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;

        const next = [...prev];
        const last = next[next.length - 1];

        if (last.role !== "ASSISTANT") return prev;

        next[next.length - 1] = {
          ...last,
          content: `${last.content}${delta}`,
        };

        return next;
      });
    },
    onDone: async () => {
      try {
        const updatedSessions = await refreshSessions();

        let targetSessionId = activeSessionId;

        if (!targetSessionId && updatedSessions.length > 0) {
          targetSessionId = updatedSessions[0].id;
          setActiveSessionId(targetSessionId);
        }

        if (targetSessionId) {
          const latestMessages = await getChatMessages(targetSessionId);
          setMessages(latestMessages);
        }
      } catch (err) {
        setError((err as Error).message || "Không thể đồng bộ dữ liệu sau khi stream");
      }
    },
    onError: (message) => {
      if (message.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authUser");
        router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setError(message);
    },
  });

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    setError(null);

    const optimisticUser = createTempUserMessage(question);
    const optimisticAssistant = createTempAssistantMessage();

    setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);
    setInput("");

    await startStream({
      question,
      sessionId: activeSessionId || undefined,
      documentId,
    });
  }, [input, isStreaming, startStream, activeSessionId, documentId]);

  const handleRename = useCallback(
    async (sessionId: string) => {
      const title = renameValue.trim();
      if (!title) return;

      try {
        const updated = await renameChatSession(sessionId, { title });
        setSessions((prev) =>
          prev.map((session) => (session.id === sessionId ? updated : session))
        );
        setRenamingSessionId(null);
        setRenameValue("");
      } catch (err) {
        setError((err as Error).message || "Không đổi được tên cuộc trò chuyện");
      }
    },
    [renameValue]
  );

  const handleDelete = useCallback(
    async (sessionId: string) => {
      const confirmed = window.confirm("Bạn có chắc muốn xoá cuộc trò chuyện này không?");
      if (!confirmed) return;

      try {
        await deleteChatSession(sessionId);

        const nextSessions = sessions.filter((session) => session.id !== sessionId);
        setSessions(nextSessions);

        if (activeSessionId === sessionId) {
          if (nextSessions.length > 0) {
            await loadSessionMessages(nextSessions[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
      } catch (err) {
        setError((err as Error).message || "Không xoá được cuộc trò chuyện");
      }
    },
    [sessions, activeSessionId, loadSessionMessages]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
    router.replace("/login");
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Đang kiểm tra đăng nhập...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <aside className="hidden w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/80 md:flex md:flex-col">
        <div className="border-b border-slate-200 p-4">
          <button
            onClick={handleNewChat}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoadingSessions ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isRenaming = renamingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`group rounded-2xl border p-3 transition ${
                      isActive
                        ? "border-slate-900 bg-white shadow-sm"
                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    {isRenaming ? (
                      <div className="space-y-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                          placeholder="Nhập tên mới..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => void handleRename(session.id)}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setRenamingSessionId(null);
                              setRenameValue("");
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => void loadSessionMessages(session.id)}
                          className="w-full text-left"
                        >
                          <div className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {session.title || "Untitled chat"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {new Date(session.updatedAt).toLocaleString("vi-VN")}
                          </div>
                        </button>

                        <div className="mt-3 flex gap-2 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setRenamingSessionId(session.id);
                              setRenameValue(session.title);
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => void handleDelete(session.id)}
                            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">
                {activeSession?.title || "Document Chat"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Hỏi đáp với tài liệu bằng AI, hỗ trợ streaming realtime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Document ID: <span className="font-semibold">{documentId}</span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-4 py-5 md:px-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoadingMessages ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-3xl bg-slate-200"
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                  AI
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Bắt đầu cuộc trò chuyện mới
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Đặt câu hỏi về tài liệu này. Hệ thống sẽ semantic search, lấy context
                  phù hợp rồi stream câu trả lời về theo thời gian thực.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.map((message) => {
                const isUser = message.role === "USER";

                return (
                    <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                    <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm md:max-w-[75%] ${
                        isUser
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-800"
                        }`}
                    >
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                        {isUser ? "You" : "Assistant"}
                        </div>

                        <div className="break-words text-sm leading-7">
                        {isUser ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                            <MarkdownMessage
                            content={message.content || (isStreaming ? "Đang trả lời..." : "")}
                            />
                        )}
                        </div>

                        <div className="mt-2 text-[11px] opacity-60">
                        {formatTime(message.createdAt)}
                        </div>
                    </div>
                    </div>
                );
                })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4 md:p-5">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi về tài liệu..."
                disabled={isStreaming}
                className="max-h-48 min-h-[56px] w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Enter để gửi · Shift + Enter để xuống dòng
                </p>

                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isStreaming ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}