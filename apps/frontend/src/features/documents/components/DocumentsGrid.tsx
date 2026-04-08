"use client";

import type { DocumentItem } from "../types/documents.types";
import DocumentCard from "./DocumentCard";

type DocumentsGridProps = {
  documents: DocumentItem[];
  onDelete: (documentId: string) => Promise<void> | void;
};

export default function DocumentsGrid({
  documents,
  onDelete,
}: DocumentsGridProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          📄
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Không có tài liệu phù hợp
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Hãy thử đổi từ khóa tìm kiếm hoặc reset bộ lọc để xem lại toàn bộ tài liệu.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}