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
    case "EXTRACTED":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "CHUNKED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
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

function getStatusLabel(status: string) {
  switch (status) {
    case "UPLOADED":
      return "Đã upload";
    case "PROCESSING":
      return "Đang xử lý";
    case "EXTRACTED":
      return "Đã extract";
    case "CHUNKED":
      return "Đã chunk";
    case "READY":
      return "Sẵn sàng";
    case "FAILED":
      return "Thất bại";
    case "DELETED":
      return "Đã xóa";
    default:
      return status;
  }
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export default DocumentStatusBadge;