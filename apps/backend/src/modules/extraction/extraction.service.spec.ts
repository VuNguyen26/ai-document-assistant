import { DocumentStatus } from '@prisma/client';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import { ExtractionService } from './extraction.service';

describe('ExtractionService storage integration', () => {
  const prisma = {
    document: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const storage = {
    write: jest.fn(),
    read: jest.fn(),
    createReadStream: jest.fn(),
    delete: jest.fn(),
  };

  const service = new ExtractionService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.document.findFirst.mockResolvedValue({
      id: 'document-id',
      title: 'Example',
      originalFilename: 'example.txt',
      mimeType: 'text/plain',
      storageKey: 'documents/example.txt',
      status: DocumentStatus.UPLOADED,
    });

    prisma.document.update.mockResolvedValue({});
  });

  it('reads the document through StorageService', async () => {
    storage.read.mockRejectedValueOnce(new Error('missing object'));

    await expect(
      service.extractDocument('document-id', 'user-id'),
    ).rejects.toThrow('Document file not found in storage');

    expect(storage.read).toHaveBeenCalledWith('documents/example.txt');

    expect(prisma.document.update).toHaveBeenLastCalledWith({
      where: {
        id: 'document-id',
      },
      data: {
        status: DocumentStatus.FAILED,
        errorMessage: 'Document file not found in storage',
      },
    });
  });
});
