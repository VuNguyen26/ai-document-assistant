import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import type { Readable } from 'node:stream';

import { StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDirectory: string;

  constructor(configService: ConfigService) {
    super();

    const configuredRoot = configService
      .get<string>('STORAGE_LOCAL_ROOT')
      ?.trim();

    this.rootDirectory = resolve(process.cwd(), configuredRoot || 'uploads');
  }

  async write(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolveStoragePath(key);

    await mkdir(dirname(filePath), {
      recursive: true,
    });

    await writeFile(filePath, data);
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveStoragePath(key));
  }

  createReadStream(key: string): Promise<Readable> {
    return Promise.resolve(createReadStream(this.resolveStoragePath(key)));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveStoragePath(key), {
      force: true,
    });
  }

  private resolveStoragePath(key: string): string {
    const normalizedKey = key.trim().replace(/\\/g, '/');

    if (
      !normalizedKey ||
      key.includes('\\') ||
      normalizedKey.includes('\0') ||
      normalizedKey.startsWith('/') ||
      isAbsolute(normalizedKey)
    ) {
      throw new Error('Invalid storage key');
    }

    const segments = normalizedKey.split('/');

    if (
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..',
      )
    ) {
      throw new Error('Invalid storage key');
    }

    const filePath = resolve(this.rootDirectory, ...segments);

    const relativePath = relative(this.rootDirectory, filePath);

    if (
      !relativePath ||
      relativePath.startsWith('..') ||
      isAbsolute(relativePath)
    ) {
      throw new Error('Invalid storage key');
    }

    return filePath;
  }
}
