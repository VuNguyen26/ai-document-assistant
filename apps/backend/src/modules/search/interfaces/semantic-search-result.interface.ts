export interface SemanticSearchResult {
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
