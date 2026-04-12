import type { DocumentProcessingJob } from "./document-jobs.types";

export type DocumentStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "EXTRACTED"
  | "CHUNKED"
  | "READY"
  | "FAILED"
  | "DELETED";

export type DocumentItem = {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: string;
  sourceLanguage: string | null;
  pageCount: number | null;
  status: DocumentStatus | string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  latestJob?: DocumentProcessingJob | null;
};

export type DocumentsListResponse = {
  items: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    ready: number;
    failed: number;
    incomplete: number;
  };
};

export type UploadDocumentResponse = {
  document: DocumentItem;
  autoQueued: boolean;
  job: DocumentProcessingJob;
};

export type DeleteDocumentResponse = {
  message: string;
};

export type DocumentContent = {
  id: string;
  documentId: string;
  rawText: string | null;
  cleanedText: string | null;
  extractedText?: string | null;
  text?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number | null;
  endOffset: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentDetailResponse = DocumentItem & {
  content?: DocumentContent | null;
  chunks?: DocumentChunk[] | null;
};

export type DocumentActionData = {
  document?: DocumentItem;
  job?: DocumentProcessingJob;
  stepsRun?: string[];
  completed?: boolean;
  reprocessed?: boolean;
  queued?: boolean;
};

export type DocumentActionResult = DocumentActionData & {
  message?: string;
  status?: string;
  documentId?: string;
};