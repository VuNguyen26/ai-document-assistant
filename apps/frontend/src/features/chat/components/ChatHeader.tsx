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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onOpenSessions}
            aria-label="Mở danh sách cuộc trò chuyện"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 lg:hidden"
          >
            <span className="h-3.5 w-4 border-y-2 border-current" />
          </button>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Chat có căn cứ
            </div>

            <h2 className="mt-3 truncate text-xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Đặt câu hỏi dựa trên nội dung của tài liệu hiện tại.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Link
            href={`/documents/${documentId}`}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Chi tiết tài liệu
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}