import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageService,
    {
      provide: StorageService,
      inject: [ConfigService, LocalStorageService],
      useFactory: (
        configService: ConfigService,
        localStorageService: LocalStorageService,
      ): StorageService => {
        const driver = (configService.get<string>('STORAGE_DRIVER') ?? 'local')
          .trim()
          .toLowerCase();

        if (driver === 'local') {
          return localStorageService;
        }

        if (driver === 'r2') {
          return new R2StorageService(configService);
        }

        throw new Error(`Unsupported storage driver: ${driver}`);
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
