type DocumentStatusBadgeProps = {
  status: string;
};

function getStatusStyle(status: string) {
  switch (status) {
    case "READY":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-100 bg-rose-50 text-rose-700";
    case "UPLOADED":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "EXTRACTED":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "CHUNKED":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    case "PROCESSING":
    case "VALIDATING":
    case "EXTRACTING":
    case "CHUNKING":
    case "EMBEDDING":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "DELETED":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "UPLOADED":
      return "Uploaded";
    case "PROCESSING":
      return "Processing";
    case "VALIDATING":
      return "Validating";
    case "EXTRACTING":
      return "Extracting";
    case "EXTRACTED":
      return "Extracted";
    case "CHUNKING":
      return "Chunking";
    case "CHUNKED":
      return "Chunked";
    case "EMBEDDING":
      return "Embedding";
    case "READY":
      return "Ready";
    case "FAILED":
      return "Failed";
    case "DELETED":
      return "Deleted";
    default:
      return status;
  }
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-[120px] shrink-0 items-center justify-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${getStatusStyle(
        status,
      )}`}
      title={getStatusLabel(status)}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export default DocumentStatusBadge;