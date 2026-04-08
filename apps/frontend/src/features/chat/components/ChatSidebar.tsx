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
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-4">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Cuộc trò chuyện mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              📝
            </div>
            <p className="text-sm font-medium text-slate-700">
              Chưa có session nào
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Hãy gửi câu hỏi đầu tiên để tạo cuộc trò chuyện mới.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const active = session.id === activeSessionId;
              const isRenaming = renamingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl border p-3 transition ${
                    active
                      ? "border-slate-900 bg-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {isRenaming ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => onRenameValueChange(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Nhập tiêu đề mới"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={onCancelRename}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmRename(session.id)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectSession(session.id)}
                        className="w-full text-left"
                      >
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {session.title}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(session.updatedAt))}
                        </p>
                      </button>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onStartRename(session)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Đổi tên
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
                          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Xóa
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