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

function formatSessionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

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
      <button
        type="button"
        aria-label="Đóng danh sách cuộc trò chuyện"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Hội thoại
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                Phiên chat
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Chat mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
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
                Chưa có cuộc trò chuyện
              </p>

              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-slate-500">
                Gửi câu hỏi đầu tiên để tạo một phiên chat mới.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((session) => {
                const active = session.id === activeSessionId;
                const isRenaming = renamingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border p-3 transition ${
                      active
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
                            onRenameValueChange(event.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                          placeholder="Tiêu đề mới"
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={onCancelRename}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Hủy
                          </button>

                          <button
                            type="button"
                            onClick={() => onConfirmRename(session.id)}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
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
                          className="block w-full text-left"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                active ? "bg-indigo-500" : "bg-slate-300"
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                                {session.title || "Chat chưa đặt tên"}
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-400">
                                {formatSessionTime(session.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onStartRename(session)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Đổi tên
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteSession(session.id)}
                            className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
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
    </div>
  );
}