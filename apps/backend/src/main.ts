import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const bootstrapLogger = new Logger('Bootstrap');

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function getAllowedOrigins(): Set<string> {
  const configuredOrigins = [
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
  ]
    .flatMap((value) => value?.split(',') ?? [])
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);

  return new Set(configuredOrigins);
}

function resolvePort(value: unknown): number {
  const port = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    return 4000;
  }

  return port;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = resolvePort(
    configService.get<unknown>('app.port') ?? process.env.PORT,
  );
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: CorsOriginCallback,
    ): void => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(normalizeOrigin(origin)));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port, '0.0.0.0');

  bootstrapLogger.log(`Backend running at http://0.0.0.0:${port}/api/v1`);
  bootstrapLogger.log(
    `CORS enabled for ${allowedOrigins.size} configured origin(s)`,
  );
}

void bootstrap().catch((error: unknown) => {
  const details =
    error instanceof Error ? (error.stack ?? error.message) : String(error);

  bootstrapLogger.error('Backend failed to start', details);
  process.exitCode = 1;
});
