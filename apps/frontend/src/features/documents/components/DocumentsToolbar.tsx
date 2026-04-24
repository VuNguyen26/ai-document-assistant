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
  { value: "ALL", label: "All statuses" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "PROCESSING", label: "Processing" },
  { value: "EXTRACTED", label: "Extracted" },
  { value: "CHUNKED", label: "Chunked" },
  { value: "READY", label: "Ready" },
  { value: "FAILED", label: "Failed" },
];

const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Created date" },
  { value: "updatedAt", label: "Updated date" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
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
  const hasActiveFilters =
    search.trim().length > 0 ||
    status !== "ALL" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Filters
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Find documents
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Search by title or filename, then narrow the list by status and
            sort order.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          <span>
            {filteredCount}/{total} documents
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="documents-search"
            className="text-sm font-semibold text-slate-700"
          >
            Keyword
          </label>

          <input
            id="documents-search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or filename"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="documents-status"
            className="text-sm font-semibold text-slate-700"
          >
            Status
          </label>

          <select
            id="documents-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
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
            className="text-sm font-semibold text-slate-700"
          >
            Sort by
          </label>

          <select
            id="documents-sort-by"
            value={sortBy}
            onChange={(event) =>
              onSortByChange(
                event.target.value as
                  | "createdAt"
                  | "updatedAt"
                  | "title"
                  | "status",
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
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
            className="text-sm font-semibold text-slate-700"
          >
            Order
          </label>

          <select
            id="documents-sort-order"
            value={sortOrder}
            onChange={(event) =>
              onSortOrderChange(event.target.value as "asc" | "desc")
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          >
            {SORT_ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}