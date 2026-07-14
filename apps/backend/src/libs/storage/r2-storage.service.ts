import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';

import { normalizeStorageKey } from './storage-key.util';
import { StorageService } from './storage.service';

@Injectable()
export class R2StorageService extends StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    super();

    const accountId = this.getRequiredConfig(configService, 'R2_ACCOUNT_ID');

    const accessKeyId = this.getRequiredConfig(
      configService,
      'R2_ACCESS_KEY_ID',
    );

    const secretAccessKey = this.getRequiredConfig(
      configService,
      'R2_SECRET_ACCESS_KEY',
    );

    this.bucket = this.getRequiredConfig(configService, 'R2_BUCKET');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async write(key: string, data: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizeStorageKey(key),
        Body: data,
      }),
    );
  }

  async read(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizeStorageKey(key),
      }),
    );

    if (!response.Body) {
      throw new Error('Stored object body is missing');
    }

    const bytes = await response.Body.transformToByteArray();

    return Buffer.from(bytes);
  }

  async createReadStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizeStorageKey(key),
      }),
    );

    if (!(response.Body instanceof Readable)) {
      throw new Error('Stored object body is not a readable stream');
    }

    return response.Body;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizeStorageKey(key),
      }),
    );
  }

  private getRequiredConfig(configService: ConfigService, key: string): string {
    const value = configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is missing in environment variables`);
    }

    return value;
  }
}
