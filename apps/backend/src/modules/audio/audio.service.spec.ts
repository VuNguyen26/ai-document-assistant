import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import type { Readable } from 'node:stream';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import { AudioService } from './audio.service';
import type { CreateAudioVersionDto } from './dto/create-audio-version.dto';

type DocumentLookup = {
  id: string;
  sourceLanguage: string | null;
  content: {
    cleanedText: string | null;
    extractedText: string;
  } | null;
};

type AudioRecord = {
  id: string;
  documentId: string | null;
  sourceType: string;
  sourceId: string | null;
  language: string;
  voiceName: string;
  speed: Prisma.Decimal;
  audioStorageKey: string;
  durationSeconds: number | null;
  status: string;
  createdAt: Date;
  document: {
    id: string;
    title: string;
    originalFilename: string;
    userId: string;
  } | null;
};

type AudioCreateArgs = {
  data: {
    documentId: string;
    sourceType: string;
    sourceId: string | null;
    language: string;
    voiceName: string;
    speed: Prisma.Decimal;
    audioStorageKey: string;
    durationSeconds: null;
    status: string;
  };
  include: unknown;
};

type AudioLookup = {
  id: string;
  audioStorageKey: string;
  document: {
    userId: string;
  } | null;
};

type DocumentFindFirst = (args: unknown) => Promise<DocumentLookup | null>;

type SummaryFindFirst = (args: unknown) => Promise<null>;

type AudioCreate = (args: AudioCreateArgs) => Promise<AudioRecord>;

type AudioFindUnique = (args: unknown) => Promise<AudioLookup | null>;

type AudioDelete = (args: unknown) => Promise<unknown>;

type GenerateAudio = (params: {
  input: string;
  language: string;
  voiceName: string;
  speed: number;
  instructions?: string;
}) => Promise<Buffer>;

type ResponseMock = {
  setHeader: jest.MockedFunction<(name: string, value: string) => void>;
  status: jest.MockedFunction<(statusCode: number) => ResponseMock>;
  json: jest.MockedFunction<(body: unknown) => ResponseMock>;
};

type StreamMock = {
  on: jest.MockedFunction<(event: string, listener: () => void) => StreamMock>;
  pipe: jest.MockedFunction<(destination: unknown) => unknown>;
};

describe('AudioService storage integration', () => {
  const documentFindFirst = jest.fn<DocumentFindFirst>();

  const summaryFindFirst = jest.fn<SummaryFindFirst>();

  const audioCreate = jest.fn<AudioCreate>();

  const audioFindUnique = jest.fn<AudioFindUnique>();

  const audioDelete = jest.fn<AudioDelete>();

  const storageWrite = jest.fn<StorageService['write']>();

  const storageRead = jest.fn<StorageService['read']>();

  const storageCreateReadStream = jest.fn<StorageService['createReadStream']>();

  const storageDelete = jest.fn<StorageService['delete']>();

  const generateAudio = jest.fn<GenerateAudio>();

  const prisma = {
    document: {
      findFirst: documentFindFirst,
    },
    summary: {
      findFirst: summaryFindFirst,
    },
    audioVersion: {
      create: audioCreate,
      findUnique: audioFindUnique,
      delete: audioDelete,
    },
  };

  const storage = {
    write: storageWrite,
    read: storageRead,
    createReadStream: storageCreateReadStream,
    delete: storageDelete,
  };

  let service: AudioService;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    documentFindFirst.mockResolvedValue({
      id: 'document-id',
      sourceLanguage: 'en',
      content: {
        cleanedText: 'Hello from document',
        extractedText: 'Hello from document',
      },
    });

    generateAudio.mockResolvedValue(Buffer.from('generated audio'));

    storageWrite.mockResolvedValue(undefined);
    storageDelete.mockResolvedValue(undefined);

    audioCreate.mockResolvedValue({
      id: 'audio-id',
      documentId: 'document-id',
      sourceType: 'DOCUMENT',
      sourceId: null,
      language: 'en',
      voiceName: 'alloy',
      speed: new Prisma.Decimal('1'),
      audioStorageKey: 'audio/generated.mp3',
      durationSeconds: null,
      status: 'READY',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      document: {
        id: 'document-id',
        title: 'Example',
        originalFilename: 'example.txt',
        userId: 'user-id',
      },
    });

    audioDelete.mockResolvedValue({
      id: 'audio-id',
    });

    service = new AudioService(
      prisma as unknown as PrismaService,
      new ConfigService({
        OPENROUTER_API_KEY: 'test-api-key',
        OPENROUTER_TTS_MODEL: 'test-model',
      }),
      storage as unknown as StorageService,
    );

    Object.defineProperty(service, 'generateAudioWithOpenRouter', {
      configurable: true,
      value: generateAudio,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes generated audio through StorageService', async () => {
    const dto: CreateAudioVersionDto = {
      documentId: 'document-id',
      sourceType: 'DOCUMENT',
    };

    await service.createAudioVersion('user-id', dto);

    expect(storageWrite).toHaveBeenCalledTimes(1);

    const [storageKey, audioBuffer] = storageWrite.mock.calls[0] as [
      string,
      Buffer,
    ];

    expect(storageKey).toMatch(/^audio\/[0-9a-f-]{36}\.mp3$/);

    expect(audioBuffer).toEqual(Buffer.from('generated audio'));

    const [createArgs] = audioCreate.mock.calls[0] as [AudioCreateArgs];

    expect(createArgs.data.audioStorageKey).toBe(storageKey);
  });

  it('deletes stored audio when database creation fails', async () => {
    audioCreate.mockRejectedValueOnce(new Error('database failure'));

    const dto: CreateAudioVersionDto = {
      documentId: 'document-id',
      sourceType: 'DOCUMENT',
    };

    await expect(
      service.createAudioVersion('user-id', dto),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    const [storageKey] = storageWrite.mock.calls[0] as [string, Buffer];

    expect(storageDelete).toHaveBeenCalledWith(storageKey);
  });

  it('deletes audio through StorageService', async () => {
    audioFindUnique.mockResolvedValueOnce({
      id: 'audio-id',
      audioStorageKey: 'audio/example.mp3',
      document: {
        userId: 'user-id',
      },
    });

    await service.deleteAudioVersion('user-id', 'audio-id');

    expect(storageDelete).toHaveBeenCalledWith('audio/example.mp3');

    expect(audioDelete).toHaveBeenCalledWith({
      where: {
        id: 'audio-id',
      },
    });
  });

  it('streams audio through StorageService', async () => {
    audioFindUnique.mockResolvedValueOnce({
      id: 'audio-id',
      audioStorageKey: 'audio/example.mp3',
      document: {
        userId: 'user-id',
      },
    });

    const stream = {} as StreamMock;

    stream.on = jest.fn(() => stream);
    stream.pipe = jest.fn();

    storageCreateReadStream.mockResolvedValueOnce(
      stream as unknown as Readable,
    );

    const response = {} as ResponseMock;

    response.setHeader = jest.fn();
    response.status = jest.fn(() => response);
    response.json = jest.fn(() => response);

    await service.streamAudioFile(
      'user-id',
      'audio-id',
      response as unknown as Response,
    );

    expect(storageCreateReadStream).toHaveBeenCalledWith('audio/example.mp3');

    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'audio/mpeg',
    );

    expect(stream.pipe).toHaveBeenCalledWith(response);
  });
});
