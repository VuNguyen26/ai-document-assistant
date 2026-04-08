export interface RagUsedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number | null;
  endOffset: number | null;
  distance: number;
  score: number;
}

export interface RagAnswerResult {
  question: string;
  answer: string;
  documentId?: string;
  documentIds: string[];
  topK: number;
  usedChunks: RagUsedChunk[];
}