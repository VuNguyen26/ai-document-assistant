import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';

import { R2StorageService } from './r2-storage.service';

type SendCommand = (command: unknown) => Promise<unknown>;

describe('R2StorageService', () => {
  const send = jest.fn<SendCommand>();

  let service: R2StorageService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new R2StorageService(
      new ConfigService({
        R2_ACCOUNT_ID: 'account-id',
        R2_ACCESS_KEY_ID: 'access-key-id',
        R2_SECRET_ACCESS_KEY: 'secret-access-key',
        R2_BUCKET: 'test-bucket',
      }),
    );

    Object.defineProperty(service, 'client', {
      configurable: true,
      value: {
        send,
      },
    });
  });

  it('writes an object with PutObjectCommand', async () => {
    send.mockResolvedValueOnce({});

    const content = Buffer.from('document');

    await service.write('documents/example.txt', content);

    const [command] = send.mock.calls[0] as [PutObjectCommand];

    expect(command).toBeInstanceOf(PutObjectCommand);

    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'documents/example.txt',
      Body: content,
    });
  });

  it('reads an object into a Buffer', async () => {
    const transformToByteArray = jest.fn<() => Promise<Uint8Array>>();

    transformToByteArray.mockResolvedValue(
      Uint8Array.from(Buffer.from('stored document')),
    );

    send.mockResolvedValueOnce({
      Body: {
        transformToByteArray,
      },
    });

    await expect(service.read('documents/example.txt')).resolves.toEqual(
      Buffer.from('stored document'),
    );

    const [command] = send.mock.calls[0] as [GetObjectCommand];

    expect(command).toBeInstanceOf(GetObjectCommand);
  });

  it('returns a readable object stream', async () => {
    const stream = Readable.from([Buffer.from('audio')]);

    send.mockResolvedValueOnce({
      Body: stream,
    });

    await expect(service.createReadStream('audio/example.mp3')).resolves.toBe(
      stream,
    );

    const [command] = send.mock.calls[0] as [GetObjectCommand];

    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'audio/example.mp3',
    });
  });

  it('deletes an object with DeleteObjectCommand', async () => {
    send.mockResolvedValueOnce({});

    await service.delete('audio/example.mp3');

    const [command] = send.mock.calls[0] as [DeleteObjectCommand];

    expect(command).toBeInstanceOf(DeleteObjectCommand);

    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'audio/example.mp3',
    });
  });

  it('rejects unsafe keys before sending a request', async () => {
    await expect(
      service.write('../escape.txt', Buffer.from('data')),
    ).rejects.toThrow('Invalid storage key');

    expect(send).not.toHaveBeenCalled();
  });
});
