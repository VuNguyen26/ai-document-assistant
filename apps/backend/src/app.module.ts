import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { PrismaModule } from './libs/prisma/prisma.module';
import { StorageModule } from './libs/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { ChunksModule } from './modules/chunks/chunks.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { SearchModule } from './modules/search/search.module';
import { ChatModule } from './modules/chat/chat.module';
import { SummariesModule } from './modules/summaries/summaries.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AudioModule } from './modules/audio/audio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnvironment,
      load: [appConfig, databaseConfig],
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    DocumentsModule,
    ExtractionModule,
    ChunksModule,
    EmbeddingsModule,
    SearchModule,
    ChatModule,
    SummariesModule,
    TranslationsModule,
    WorkspacesModule,
    AudioModule,
  ],
})
export class AppModule {}
