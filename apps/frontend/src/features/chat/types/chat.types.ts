export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type ChatCitation = {
  id?: string;
  chunkId: string | null;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number | null;
  endOffset: number | null;
  distance: number;
  score: number;
};

export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  citations?: ChatCitation[];
};

export type ChatSession = {
  id: string;
  title: string | null;
  documentId: string | null;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionsResponse = {
  data: ChatSession[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AskChatPayload = {
  question: string;
  documentId?: string;
  workspaceId?: string;
  sessionId?: string;
  topK?: number;
};

export type AskChatResponse = {
  sessionId: string;
  question: string;
  answer: string;
  documentId?: string;
  workspaceId?: string;
  documentIds: string[];
  topK: number;
  usedChunks: ChatCitation[];
};

export type RenameSessionPayload = {
  title: string;
};

export type StreamMetaEvent = {
  sessionId: string;
  question: string;
  documentId: string | null;
  workspaceId: string | null;
  documentIds: string[];
  topK: number;
  usedChunks: ChatCitation[];
};

export type StreamChatHandlers = {
  onMeta?: (meta: StreamMetaEvent) => void;
  onDelta?: (payload: { content: string }) => void;
  onDone?: (payload: { sessionId: string; answer: string }) => void;
  onError?: (payload: { message: string }) => void;
};