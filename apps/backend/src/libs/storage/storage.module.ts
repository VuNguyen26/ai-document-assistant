import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LocalStorageService } from './local-storage.service';
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

        if (driver !== 'local') {
          throw new Error(`Unsupported storage driver: ${driver}`);
        }

        return localStorageService;
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
