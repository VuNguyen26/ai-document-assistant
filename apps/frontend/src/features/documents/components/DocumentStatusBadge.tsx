type DocumentStatusBadgeProps = {
  status: string;
};

function getStatusStyle(status: string) {
  switch (status) {
    case "READY":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "UPLOADED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PROCESSING":
    case "VALIDATING":
    case "EXTRACTING":
    case "CHUNKING":
    case "EMBEDDING":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function DocumentStatusBadge({
  status,
}: DocumentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
        status,
      )}`}
    >
      {status}
    </span>
  );
}