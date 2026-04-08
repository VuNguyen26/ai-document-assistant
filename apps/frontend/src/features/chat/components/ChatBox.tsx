"use client";

import { logout } from "@/features/auth/api/auth.api";
import { getAccessToken } from "@/lib/auth/token-storage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
} from "../api/chat.api";
import { useChatStream } from "../hooks/useChatStream";
import type {
  ChatMessage,
  ChatSession,
  StreamMetaEvent,
} from "../types/chat.types";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatSidebar from "./ChatSidebar";

type ChatBoxProps = {
  documentId: string;
};

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
    const token = getAccessToken();

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

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
  }, [isCheckingAuth, loadSessionMessages, refreshSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  const { isStreaming, startStream } = useChatStream({
    onMeta: (meta: StreamMetaEvent) => {
      if (meta?.sessionId) {
        setActiveSessionId((prev) => prev ?? String(meta.sessionId));
      }
    },
    onDelta: (delta: string) => {
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
    onError: (message: string) => {
      if (message.toLowerCase().includes("unauthorized")) {
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

    try {
      await startStream({
        question,
        sessionId: activeSessionId || undefined,
        documentId,
      });
    } catch (err) {
      setError((err as Error).message || "Không gửi được câu hỏi");
    }
  }, [activeSessionId, documentId, input, isStreaming, startStream]);

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
    [activeSessionId, loadSessionMessages, sessions]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
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
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isLoading={isLoadingSessions}
        renamingSessionId={renamingSessionId}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onNewChat={handleNewChat}
        onSelectSession={(sessionId) => void loadSessionMessages(sessionId)}
        onStartRename={(session) => {
          setRenamingSessionId(session.id);
          setRenameValue(session.title);
        }}
        onCancelRename={() => {
          setRenamingSessionId(null);
          setRenameValue("");
        }}
        onConfirmRename={(sessionId) => void handleRename(sessionId)}
        onDeleteSession={(sessionId) => void handleDelete(sessionId)}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={activeSession?.title || "Document Chat"}
          documentId={documentId}
          onLogout={handleLogout}
        />

        <ChatMessageList
          messages={messages}
          isLoading={isLoadingMessages}
          isStreaming={isStreaming}
          error={error}
          messagesEndRef={messagesEndRef}
        />

        <ChatComposer
          input={input}
          isStreaming={isStreaming}
          textareaRef={textareaRef}
          onInputChange={setInput}
          onSend={() => void handleSend()}
        />
      </section>
    </div>
  );
}