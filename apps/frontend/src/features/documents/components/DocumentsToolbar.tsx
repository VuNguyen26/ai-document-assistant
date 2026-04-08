"use client";

type DocumentsToolbarProps = {
  search: string;
  status: string;
  total: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "READY", label: "READY" },
  { value: "FAILED", label: "FAILED" },
  { value: "UPLOADED", label: "UPLOADED" },
  { value: "PROCESSING", label: "PROCESSING" },
  { value: "VALIDATING", label: "VALIDATING" },
  { value: "EXTRACTING", label: "EXTRACTING" },
  { value: "CHUNKING", label: "CHUNKING" },
  { value: "EMBEDDING", label: "EMBEDDING" },
];

export default function DocumentsToolbar({
  search,
  status,
  total,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onReset,
}: DocumentsToolbarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Tìm kiếm tài liệu
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tìm theo tiêu đề, tên file gốc hoặc lọc theo trạng thái xử lý.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          {filteredCount}/{total} tài liệu
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto]">
        <div className="space-y-2">
          <label
            htmlFor="documents-search"
            className="text-sm font-medium text-slate-700"
          >
            Từ khóa
          </label>
          <input
            id="documents-search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc tên file..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="documents-status"
            className="text-sm font-medium text-slate-700"
          >
            Trạng thái
          </label>
          <select
            id="documents-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-[50px] items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Reset bộ lọc
        </button>
      </div>
    </section>
  );
}