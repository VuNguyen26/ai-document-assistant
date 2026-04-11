export type TranslationSourceType = 'DOCUMENT' | 'SUMMARY';

export type TranslationItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentOriginalFilename: string;
  sourceType: TranslationSourceType;
  sourceId: string | null;
  sourceLabel: string;
  sourceSummaryType: string | null;
  sourceSummaryLanguage: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  style: string | null;
  content: string;
  createdByAiModel: string;
  createdAt: string;
};

export type TranslationsListResponse = {
  items: TranslationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateTranslationPayload = {
  documentId: string;
  sourceType: TranslationSourceType;
  sourceId?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style?: string;
};