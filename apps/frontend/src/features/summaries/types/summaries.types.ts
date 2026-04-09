export type SummaryType =
  | "SHORT"
  | "DETAILED"
  | "BULLET"
  | "BEGINNER"
  | "PRESENTATION";

export type SummaryItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentOriginalFilename: string;
  language: string;
  summaryType: SummaryType;
  promptStyle: string | null;
  content: string;
  createdByAiModel: string;
  createdAt: string;
};

export type SummariesListResponse = {
  items: SummaryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateSummaryPayload = {
  documentId: string;
  summaryType: SummaryType;
  language?: string;
  promptStyle?: string;
};