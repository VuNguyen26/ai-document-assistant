"use client";

import Link from "next/link";

type ChatHeaderProps = {
  title: string;
  documentId: string;
  onLogout: () => void;
  onOpenSessions?: () => void;
};

export default function ChatHeader({
  title,
  documentId,
  onLogout,
  onOpenSessions,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onOpenSessions}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 lg:hidden"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Grounded Chat
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hỏi đáp theo nội dung tài liệu hiện tại.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/documents/${documentId}`}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Chi tiết tài liệu
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}