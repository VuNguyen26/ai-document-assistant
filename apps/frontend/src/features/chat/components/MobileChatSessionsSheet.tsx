"use client";

import type { ChatSession } from "../types/chat.types";

type MobileChatSessionsSheetProps = {
  open: boolean;
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
  onClose: () => void;
};

export default function MobileChatSessionsSheet({
  open,
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
  onClose,
}: MobileChatSessionsSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm border-r border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Chat Sessions
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Lịch sử hội thoại
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-200 p-4">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Cuộc trò chuyện mới
          </button>
        </div>

        <div className="h-[calc(100%-145px)] overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                📝
              </div>
              <p className="text-sm font-medium text-slate-700">
                Chưa có session nào
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Hãy gửi câu hỏi đầu tiên để tạo hội thoại mới.
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
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white"
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
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => onConfirmRename(session.id)}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSession(session.id);
                            onClose();
                          }}
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
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                          >
                            Đổi tên
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteSession(session.id)}
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
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
      </div>
    </div>
  );
}