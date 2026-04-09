"use client";

type DocumentsToolbarProps = {
  search: string;
  status: string;
  sortBy: "createdAt" | "updatedAt" | "title" | "status";
  sortOrder: "asc" | "desc";
  total: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortByChange: (value: "createdAt" | "updatedAt" | "title" | "status") => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  onReset: () => void;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "UPLOADED", label: "Đã upload" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "EXTRACTED", label: "Đã extract" },
  { value: "CHUNKED", label: "Đã chunk" },
  { value: "READY", label: "Sẵn sàng" },
  { value: "FAILED", label: "Thất bại" },
];

const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "updatedAt", label: "Ngày cập nhật" },
  { value: "title", label: "Tiêu đề" },
  { value: "status", label: "Trạng thái" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Giảm dần" },
  { value: "asc", label: "Tăng dần" },
] as const;

export default function DocumentsToolbar({
  search,
  status,
  sortBy,
  sortOrder,
  total,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onSortByChange,
  onSortOrderChange,
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
            Search, filter và sort hiện đã chạy bằng backend thật.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          {filteredCount}/{total} tài liệu
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_auto]">
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

        <div className="space-y-2">
          <label
            htmlFor="documents-sort-by"
            className="text-sm font-medium text-slate-700"
          >
            Sắp xếp theo
          </label>
          <select
            id="documents-sort-by"
            value={sortBy}
            onChange={(e) =>
              onSortByChange(
                e.target.value as "createdAt" | "updatedAt" | "title" | "status",
              )
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {SORT_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="documents-sort-order"
            className="text-sm font-medium text-slate-700"
          >
            Thứ tự
          </label>
          <select
            id="documents-sort-order"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as "asc" | "desc")}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {SORT_ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-[50px] items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 xl:self-end"
        >
          Reset bộ lọc
        </button>
      </div>
    </section>
  );
}