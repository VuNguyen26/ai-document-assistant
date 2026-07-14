import { DocumentStatus } from '@prisma/client';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import { DocumentPipelineService } from './document-pipeline.service';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import { DocumentsService } from './documents.service';
import type { UploadedFile } from './interfaces/uploaded-file.interface';

describe('DocumentsService storage integration', () => {
  const prisma = {
    document: {
      create: jest.fn(),
    },
  };

  const storage = {
    write: jest.fn(),
    read: jest.fn(),
    createReadStream: jest.fn(),
    delete: jest.fn(),
  };

  const processingJobs = {
    enqueueProcessJob: jest.fn(),
  };

  const service = new DocumentsService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
    {} as DocumentPipelineService,
    processingJobs as unknown as DocumentProcessingJobsService,
  );

  const file: UploadedFile = {
    fieldname: 'file',
    originalname: 'example.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: 15,
    buffer: Buffer.from('example content'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    storage.write.mockResolvedValue(undefined);
    storage.delete.mockResolvedValue(undefined);

    prisma.document.create.mockResolvedValue({
      id: 'document-id',
      userId: 'user-id',
      title: 'example',
      originalFilename: file.originalname,
      storageKey: 'documents/generated.txt',
      mimeType: file.mimetype,
      fileSize: BigInt(file.size),
      sourceLanguage: null,
      pageCount: null,
      status: DocumentStatus.UPLOADED,
      errorMessage: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    });

    processingJobs.enqueueProcessJob.mockResolvedValue({
      id: 'job-id',
      type: 'PROCESS',
      status: 'QUEUED',
      attempts: 0,
      maxAttempts: 3,
      errorMessage: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
      nextRunAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('writes the uploaded buffer through StorageService', async () => {
    await service.upload('user-id', {}, file);

    expect(storage.write).toHaveBeenCalledTimes(1);

    const [storageKey, storedBuffer] = storage.write.mock.calls[0] as [
      string,
      Buffer,
    ];

    expect(storageKey).toMatch(/^documents\/[0-9a-f-]{36}\.txt$/);
    expect(storedBuffer).toBe(file.buffer);

    const [createInput] = prisma.document.create.mock.calls[0] as [
      {
        data: {
          storageKey: string;
        };
      },
    ];

    expect(createInput.data.storageKey).toBe(storageKey);
  });

  it('deletes the stored object when database creation fails', async () => {
    prisma.document.create.mockRejectedValueOnce(new Error('database failure'));

    await expect(service.upload('user-id', {}, file)).rejects.toThrow(
      'database failure',
    );

    const [storageKey] = storage.write.mock.calls[0] as [string, Buffer];

    expect(storage.delete).toHaveBeenCalledWith(storageKey);
    expect(processingJobs.enqueueProcessJob).not.toHaveBeenCalled();
  });
});
