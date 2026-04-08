"use client";

type ChatHeaderProps = {
  title: string;
  documentId: string;
  onLogout: () => void;
};

export default function ChatHeader({
  title,
  documentId,
  onLogout,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hỏi đáp với tài liệu bằng AI, hỗ trợ streaming realtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Document ID: <span className="font-semibold">{documentId}</span>
          </div>

          <button
            onClick={onLogout}
            className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}