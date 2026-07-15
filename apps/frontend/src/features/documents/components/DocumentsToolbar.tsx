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
  onSortByChange: (
    value: "createdAt" | "updatedAt" | "title" | "status",
  ) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  onReset: () => void;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "T\u1ea5t c\u1ea3 tr\u1ea1ng th\xe1i" },
  { value: "UPLOADED", label: "\u0110\xe3 t\u1ea3i l\xean" },
  { value: "PROCESSING", label: "\u0110ang x\u1eed l\xfd" },
  { value: "EXTRACTED", label: "\u0110\xe3 tr\xedch xu\u1ea5t" },
  { value: "CHUNKED", label: "\u0110\xe3 chia \u0111o\u1ea1n" },
  { value: "READY", label: "S\u1eb5n s\xe0ng" },
  { value: "FAILED", label: "Th\u1ea5t b\u1ea1i" },
];

const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Ng\xe0y t\u1ea1o" },
  { value: "updatedAt", label: "Ng\xe0y c\u1eadp nh\u1eadt" },
  { value: "title", label: "Ti\xeau \u0111\u1ec1" },
  { value: "status", label: "Tr\u1ea1ng th\xe1i" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "M\u1edbi nh\u1ea5t tr\u01b0\u1edbc" },
  { value: "asc", label: "C\u0169 nh\u1ea5t tr\u01b0\u1edbc" },
] as const;

const CONTROL_CLASS =
  "h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-800 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50";

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
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            {"T\xecm ki\u1ebfm v\xe0 s\u1eafp x\u1ebfp"}
          </p>

          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
            {"B\u1ed9 l\u1ecdc t\xe0i li\u1ec7u"}
          </h2>
        </div>

        <div className="inline-flex w-fit items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          {filteredCount}/{total} {"t\xe0i li\u1ec7u"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="documents-search" className="sr-only">
            {"T\u1eeb kh\xf3a"}
          </label>

          <input
            id="documents-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={
              "T\xecm theo ti\xeau \u0111\u1ec1 ho\u1eb7c t\xean t\u1ec7p"
            }
            className={CONTROL_CLASS}
          />
        </div>

        <div>
          <label htmlFor="documents-status" className="sr-only">
            {"Tr\u1ea1ng th\xe1i"}
          </label>

          <select
            id="documents-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className={CONTROL_CLASS}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="documents-sort-by" className="sr-only">
            {"S\u1eafp x\u1ebfp theo"}
          </label>

          <select
            id="documents-sort-by"
            value={sortBy}
            onChange={(event) =>
              onSortByChange(
                event.target.value as
                  "createdAt" | "updatedAt" | "title" | "status",
              )
            }
            className={CONTROL_CLASS}
          >
            {SORT_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="documents-sort-order" className="sr-only">
            {"Th\u1ee9 t\u1ef1"}
          </label>

          <select
            id="documents-sort-order"
            value={sortOrder}
            onChange={(event) =>
              onSortOrderChange(event.target.value as "asc" | "desc")
            }
            className={CONTROL_CLASS}
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
          disabled={!hasActiveFilters}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          {"\u0110\u1eb7t l\u1ea1i"}
        </button>
      </div>
    </section>
  );
}
