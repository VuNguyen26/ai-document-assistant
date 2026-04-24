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
    return null;
  }

  return (
    <div className="space-y-4">
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