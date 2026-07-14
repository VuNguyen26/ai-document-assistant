import type { Readable } from 'node:stream';

export abstract class StorageService {
  abstract write(key: string, data: Buffer): Promise<void>;

  abstract read(key: string): Promise<Buffer>;

  abstract createReadStream(key: string): Promise<Readable>;

  abstract delete(key: string): Promise<void>;
}
