import { ConfigService } from '@nestjs/config';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let rootDirectory: string;
  let service: LocalStorageService;

  beforeEach(async () => {
    rootDirectory = await mkdtemp(join(tmpdir(), 'storage-service-'));

    service = new LocalStorageService(
      new ConfigService({
        STORAGE_LOCAL_ROOT: rootDirectory,
      }),
    );
  });

  afterEach(async () => {
    await rm(rootDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('writes and reads a stored object', async () => {
    const key = 'documents/example.txt';
    const content = Buffer.from('hello storage');

    await service.write(key, content);

    await expect(service.read(key)).resolves.toEqual(content);
  });

  it('deletes an object idempotently', async () => {
    const key = 'audio/example.mp3';

    await service.write(key, Buffer.from('audio'));

    await service.delete(key);
    await service.delete(key);

    await expect(service.read(key)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it.each([
    '',
    '../escape.txt',
    'documents/../escape.txt',
    '/absolute.txt',
    'documents//file.txt',
    'documents\\file.txt',
  ])('rejects unsafe storage key %p', async (key) => {
    await expect(service.write(key, Buffer.from('data'))).rejects.toThrow(
      'Invalid storage key',
    );
  });
});
