import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '');
}

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    'https://ai-document-assistant-tau.vercel.app',
  ]
    .filter(Boolean)
    .map((item) => normalizeOrigin(item!));

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const url = new URL(normalizedOrigin);

    if (url.hostname === 'vercel.app' || url.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('app.port') ?? Number(process.env.PORT) ?? 4000;

  app.enableCors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  console.log(`Backend running at http://0.0.0.0:${port}/api/v1`);
  console.log(`FRONTEND_URL=${process.env.FRONTEND_URL || 'not set'}`);
}

bootstrap();