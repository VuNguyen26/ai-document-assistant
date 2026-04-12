export type DocumentProcessingJobType = 'PROCESS' | 'REPROCESS';

export type DocumentProcessingJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export type DocumentProcessingJob = {
  id: string;
  userId: string;
  documentId: string;
  type: DocumentProcessingJobType;
  status: DocumentProcessingJobStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage: string | null;
  lockedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentJobsListResponse = {
  items: DocumentProcessingJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function isDocumentJobActive(
  job?: DocumentProcessingJob | null,
): boolean {
  if (!job) return false;

  return (
    job.status === 'QUEUED' ||
    job.status === 'RUNNING' ||
    job.status === 'RETRYING'
  );
}