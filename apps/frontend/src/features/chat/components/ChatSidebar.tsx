"use client";

import type { ChatSession } from "../types/chat.types";

type ChatSidebarProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  renamingSessionId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onStartRename: (session: ChatSession) => void;
  onCancelRename: () => void;
  onConfirmRename: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

export default function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading,
  renamingSessionId,
  renameValue,
  onRenameValueChange,
  onNewChat,
  onSelectSession,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <aside className="hidden w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/80 md:flex md:flex-col">
      <div className="border-b border-slate-200 p-4">
        <button
          onClick={onNewChat}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
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
                        onChange={(e) => onRenameValueChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                        placeholder="Nhập tên mới..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onConfirmRename(session.id)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={onCancelRename}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectSession(session.id)}
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
                          onClick={() => onStartRename(session)}
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => onDeleteSession(session.id)}
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
  );
}