export type ChatRole = "USER" | "ASSISTANT";

export interface ChatSession {
  id: string;
  title: string;
  documentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface AskChatPayload {
  question: string;
  sessionId?: string;
  documentId?: string;
}

export interface RenameSessionPayload {
  title: string;
}

export interface AskChatResponse {
  sessionId: string;
  answer: string;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface StreamMetaEvent {
  sessionId?: string;
  [key: string]: unknown;
}

export type StreamEvent =
  | { type: "meta"; data: StreamMetaEvent }
  | { type: "delta"; data: string }
  | { type: "done"; data?: unknown }
  | { type: "error"; data: string };

export interface UseChatStreamOptions {
  onMeta?: (meta: StreamMetaEvent) => void;
  onDelta?: (delta: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}