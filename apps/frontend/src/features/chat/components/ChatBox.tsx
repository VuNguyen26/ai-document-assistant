"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { logout } from "@/features/auth/api/auth.api";
import { getAccessToken } from "@/lib/auth/token-storage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
} from "../api/chat.api";
import { useChatStream } from "../hooks/useChatStream";
import type {
  ChatCitation,
  ChatMessage,
  ChatSession,
  StreamMetaEvent,
} from "../types/chat.types";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatSidebar from "./ChatSidebar";
import MobileChatSessionsSheet from "./MobileChatSessionsSheet";

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
    citations: [],
  };
}

function attachCitationsToLatestAssistant(
  source: ChatMessage[],
  citations: ChatCitation[],
): ChatMessage[] {
  if (!citations.length) return source;

  const next = [...source];

  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (next[i].role === "ASSISTANT") {
      next[i] = {
        ...next[i],
        citations,
      };
      break;
    }
  }

  return next;
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
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const latestMetaRef = useRef<StreamMetaEvent | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId],
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
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
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

        const matchingSession =
          data.find(
            (session) =>
              "documentId" in session &&
              String(
                (session as ChatSession & { documentId?: string | null })
                  .documentId,
              ) === String(documentId),
          ) || data[0];

        if (matchingSession) {
          await loadSessionMessages(matchingSession.id);
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
  }, [documentId, isCheckingAuth, loadSessionMessages, refreshSessions]);

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
      latestMetaRef.current = meta;

      if (meta?.sessionId) {
        setActiveSessionId((prev) => prev ?? String(meta.sessionId));
      }

      const citations = meta.usedChunks ?? [];

      if (citations.length) {
        setMessages((prev) => attachCitationsToLatestAssistant(prev, citations));
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

        let targetSessionId =
          latestMetaRef.current?.sessionId?.toString() || activeSessionId;

        if (!targetSessionId) {
          const matchingSession =
            updatedSessions.find(
              (session) =>
                "documentId" in session &&
                String(
                  (session as ChatSession & { documentId?: string | null })
                    .documentId,
                ) === String(documentId),
            ) || updatedSessions[0];

          if (matchingSession) {
            targetSessionId = matchingSession.id;
            setActiveSessionId(targetSessionId);
          }
        }

        if (targetSessionId) {
          const latestMessages = await getChatMessages(targetSessionId);
          const citations = latestMetaRef.current?.usedChunks ?? [];

          setMessages(attachCitationsToLatestAssistant(latestMessages, citations));
          toast.success("Đã cập nhật hội thoại.");
        }

        latestMetaRef.current = null;
      } catch (err) {
        setError(
          (err as Error).message || "Không thể đồng bộ dữ liệu sau khi stream",
        );
      }
    },
    onError: (message: string) => {
      if (message.toLowerCase().includes("unauthorized")) {
        router.replace(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }

      setError(message);
      toast.error(message);
      latestMetaRef.current = null;
    },
  });

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setInput("");
    latestMetaRef.current = null;
    toast.success("Sẵn sàng cho cuộc trò chuyện mới.");
  }, []);

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    setError(null);
    latestMetaRef.current = null;

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
      const message = (err as Error).message || "Không gửi được câu hỏi";
      setError(message);
      toast.error(message);
    }
  }, [activeSessionId, documentId, input, isStreaming, startStream]);

  const handleRename = useCallback(
    async (sessionId: string) => {
      const title = renameValue.trim();
      if (!title) return;

      try {
        const updated = await renameChatSession(sessionId, { title });
        setSessions((prev) =>
          prev.map((session) => (session.id === sessionId ? updated : session)),
        );
        setRenamingSessionId(null);
        setRenameValue("");
        toast.success("Đổi tên cuộc trò chuyện thành công.");
      } catch (err) {
        const message =
          (err as Error).message || "Không đổi được tên cuộc trò chuyện";
        setError(message);
        toast.error(message);
      }
    },
    [renameValue],
  );

  const handleDelete = useCallback(
    (sessionId: string) => {
      const target =
        sessions.find((session) => session.id === sessionId) || null;
      setDeleteTarget(target);
    },
    [sessions],
  );

  const confirmDeleteSession = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      setIsDeletingSession(true);
      await deleteChatSession(deleteTarget.id);

      const nextSessions = sessions.filter(
        (session) => session.id !== deleteTarget.id,
      );
      setSessions(nextSessions);

      if (activeSessionId === deleteTarget.id) {
        const matchingSession =
          nextSessions.find(
            (session) =>
              "documentId" in session &&
              String(
                (session as ChatSession & { documentId?: string | null })
                  .documentId,
              ) === String(documentId),
          ) || nextSessions[0];

        if (matchingSession) {
          await loadSessionMessages(matchingSession.id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }

      setDeleteTarget(null);
      toast.success("Đã xóa cuộc trò chuyện.");
    } catch (err) {
      const message = (err as Error).message || "Không xoá được cuộc trò chuyện";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeletingSession(false);
    }
  }, [
    activeSessionId,
    deleteTarget,
    documentId,
    loadSessionMessages,
    sessions,
  ]);

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
    <>
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
          onDeleteSession={(sessionId) => handleDelete(sessionId)}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <ChatHeader
            title={activeSession?.title || "Document Chat"}
            documentId={documentId}
            onLogout={handleLogout}
            onOpenSessions={() => setMobileSessionsOpen(true)}
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

      <MobileChatSessionsSheet
        open={mobileSessionsOpen}
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
        onDeleteSession={(sessionId) => handleDelete(sessionId)}
        onClose={() => setMobileSessionsOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa cuộc trò chuyện?"
        description={`Session "${deleteTarget?.title || ""}" sẽ bị xóa khỏi danh sách hội thoại.`}
        confirmText="Xóa session"
        cancelText="Hủy"
        tone="danger"
        loading={isDeletingSession}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteSession()}
      />
    </>
  );
}