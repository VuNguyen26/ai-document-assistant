export type DocumentStatus =
  | "UPLOADED"
  | "READY"
  | "FAILED"
  | "DELETED"
  | "PROCESSING"
  | "VALIDATING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING";

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
};

export type DocumentsListResponse = {
  items: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UploadDocumentResponse = DocumentItem;

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
  chunks?: DocumentChunk[];
};

export type DocumentActionResult = {
  message?: string;
  status?: string;
  document?: DocumentItem;
  documentId?: string;
};