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
    <aside className="hidden w-[310px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Conversations
          </p>

          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            Chat sessions
          </h2>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          New chat
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
              No conversations yet
            </p>

            <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
              Send your first question to create a new chat session.
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
                        placeholder="New title"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={onCancelRename}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => onConfirmRename(session.id)}
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
                        onClick={() => onSelectSession(session.id)}
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
                              {session.title || "Untitled chat"}
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
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
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
  );
}