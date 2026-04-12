import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { DocumentPipelineService } from './document-pipeline.service';

type DocumentProcessingJobType = 'PROCESS' | 'REPROCESS';
type DocumentProcessingJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

type DocumentProcessingJobRecord = {
  id: string;
  userId: string;
  documentId: string;
  type: DocumentProcessingJobType;
  status: DocumentProcessingJobStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage: string | null;
  lockedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const ACTIVE_JOB_STATUSES: DocumentProcessingJobStatus[] = [
  'QUEUED',
  'RUNNING',
  'RETRYING',
];

@Injectable()
export class DocumentProcessingJobsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DocumentProcessingJobsService.name);
  private readonly pollIntervalMs = 3000;
  private readonly maxAttempts = 3;
  private timer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentPipelineService: DocumentPipelineService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.pollNextJob();
    }, this.pollIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueueProcessJob(userId: string, documentId: string) {
    return this.enqueueJob(userId, documentId, 'PROCESS');
  }

  async enqueueReprocessJob(userId: string, documentId: string) {
    return this.enqueueJob(userId, documentId, 'REPROCESS');
  }

  async listJobsForDocument(
    userId: string,
    documentId: string,
    page = 1,
    limit = 10,
  ) {
    await this.documentPipelineService.findOwnedDocumentOrThrow(userId, documentId);

    const skip = (page - 1) * limit;

    const items = await this.prisma.$queryRawUnsafe<DocumentProcessingJobRecord[]>(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM document_processing_jobs
        WHERE user_id = $1 AND document_id = $2
        ORDER BY created_at DESC
        OFFSET $3 LIMIT $4
      `,
      userId,
      documentId,
      skip,
      limit,
    );

    const totalRows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS count
        FROM document_processing_jobs
        WHERE user_id = $1 AND document_id = $2
      `,
      userId,
      documentId,
    );

    const total = Number(totalRows[0]?.count ?? 0n);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
      },
    };
  }

  async getLatestJobForDocument(userId: string, documentId: string) {
    const rows = await this.prisma.$queryRawUnsafe<DocumentProcessingJobRecord[]>(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM document_processing_jobs
        WHERE user_id = $1 AND document_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      userId,
      documentId,
    );

    return rows[0] ?? null;
  }

  private async enqueueJob(
    userId: string,
    documentId: string,
    type: DocumentProcessingJobType,
  ) {
    await this.documentPipelineService.findOwnedDocumentOrThrow(userId, documentId);

    const existingActiveJob = await this.prisma.$queryRawUnsafe<
      DocumentProcessingJobRecord[]
    >(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM document_processing_jobs
        WHERE user_id = $1
          AND document_id = $2
          AND status = ANY($3::"DocumentProcessingJobStatus"[])
        ORDER BY created_at DESC
        LIMIT 1
      `,
      userId,
      documentId,
      ACTIVE_JOB_STATUSES,
    );

    if (existingActiveJob.length > 0) {
      throw new BadRequestException(
        'Tài liệu đã có job đang chờ hoặc đang chạy.',
      );
    }

    await this.documentPipelineService.markDocumentQueued(documentId);

    const rows = await this.prisma.$queryRawUnsafe<DocumentProcessingJobRecord[]>(
      `
        INSERT INTO document_processing_jobs (
          id,
          user_id,
          document_id,
          type,
          status,
          attempts,
          max_attempts,
          next_run_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::"DocumentProcessingJobType", 'QUEUED', 0, $5, NOW(), NOW(), NOW())
        RETURNING
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      randomUUID(),
      userId,
      documentId,
      type,
      this.maxAttempts,
    );

    return rows[0];
  }

  private async pollNextJob() {
    if (this.isPolling) return;

    this.isPolling = true;

    try {
      const job = await this.claimNextJob();

      if (!job) return;

      await this.runJob(job);
    } catch (error) {
      this.logger.error('Document job polling failed', error as Error);
    } finally {
      this.isPolling = false;
    }
  }

  private async claimNextJob() {
    const nextJobs = await this.prisma.$queryRawUnsafe<DocumentProcessingJobRecord[]>(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM document_processing_jobs
        WHERE status IN ('QUEUED', 'RETRYING')
          AND next_run_at <= NOW()
        ORDER BY next_run_at ASC, created_at ASC
        LIMIT 1
      `,
    );

    const nextJob = nextJobs[0];

    if (!nextJob) {
      return null;
    }

    const claimedCount = await this.prisma.$executeRawUnsafe(
      `
        UPDATE document_processing_jobs
        SET status = 'RUNNING',
            locked_at = NOW(),
            started_at = COALESCE(started_at, NOW()),
            error_message = NULL,
            updated_at = NOW()
        WHERE id = $1
          AND status = $2::"DocumentProcessingJobStatus"
      `,
      nextJob.id,
      nextJob.status,
    );

    if (claimedCount === 0) {
      return null;
    }

    const claimedRows = await this.prisma.$queryRawUnsafe<DocumentProcessingJobRecord[]>(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          locked_at AS "lockedAt",
          started_at AS "startedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM document_processing_jobs
        WHERE id = $1
      `,
      nextJob.id,
    );

    return claimedRows[0] ?? null;
  }

  private async runJob(job: DocumentProcessingJobRecord) {
    try {
      if (job.type === 'REPROCESS') {
        await this.documentPipelineService.reprocessDocument(
          job.userId,
          job.documentId,
        );
      } else {
        await this.documentPipelineService.processDocument(
          job.userId,
          job.documentId,
        );
      }

      await this.prisma.$executeRawUnsafe(
        `
          UPDATE document_processing_jobs
          SET attempts = $2,
              status = 'SUCCEEDED',
              locked_at = NULL,
              completed_at = NOW(),
              error_message = NULL,
              updated_at = NOW()
          WHERE id = $1
        `,
        job.id,
        job.attempts + 1,
      );
    } catch (error) {
      const attempts = job.attempts + 1;
      const message =
        error instanceof Error ? error.message : 'Unknown background job error';

      await this.documentPipelineService.markDocumentFailed(job.documentId, message);

      if (attempts < job.maxAttempts) {
        const retryAt = new Date(Date.now() + attempts * 5000);

        await this.prisma.$executeRawUnsafe(
          `
            UPDATE document_processing_jobs
            SET attempts = $2,
                status = 'RETRYING',
                locked_at = NULL,
                error_message = $3,
                next_run_at = $4,
                updated_at = NOW()
            WHERE id = $1
          `,
          job.id,
          attempts,
          message,
          retryAt,
        );

        this.logger.warn(
          `Retrying document job ${job.id} at ${retryAt.toISOString()}: ${message}`,
        );

        return;
      }

      await this.prisma.$executeRawUnsafe(
        `
          UPDATE document_processing_jobs
          SET attempts = $2,
              status = 'FAILED',
              locked_at = NULL,
              completed_at = NOW(),
              error_message = $3,
              updated_at = NOW()
          WHERE id = $1
        `,
        job.id,
        attempts,
        message,
      );

      this.logger.error(`Document job ${job.id} failed permanently: ${message}`);
    }
  }
}