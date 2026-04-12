export type AudioSourceType = 'DOCUMENT' | 'SUMMARY';

export type AudioVersionItem = {
  id: string;
  documentId: string | null;
  documentTitle: string | null;
  documentOriginalFilename: string | null;
  sourceType: AudioSourceType;
  sourceId: string | null;
  sourceLabel: string;
  sourceSummaryType: string | null;
  sourceSummaryLanguage: string | null;
  language: string;
  voiceName: string;
  speed: number;
  audioStorageKey: string;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
  fileUrl: string;
};

export type AudioVersionsListResponse = {
  items: AudioVersionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateAudioVersionPayload = {
  documentId: string;
  sourceType: AudioSourceType;
  sourceId?: string;
  language?: string;
  voiceName?: string;
  speed?: number;
  instructions?: string;
};