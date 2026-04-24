import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

function getAllowedOrigin(origin?: string) {
  if (!origin) return '*';

  const allowedOrigins = [
    'http://localhost:3000',
    'https://ai-document-assistant-tau.vercel.app',
    process.env.FRONTEND_URL,
  ]
    .filter(Boolean)
    .map((item) => item!.replace(/\/$/, ''));

  const normalizedOrigin = origin.replace(/\/$/, '');

  if (allowedOrigins.includes(normalizedOrigin)) {
    return origin;
  }

  try {
    const url = new URL(normalizedOrigin);

    if (url.hostname === 'vercel.app' || url.hostname.endsWith('.vercel.app')) {
      return origin;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('app.port') ?? Number(process.env.PORT) ?? 4000;

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigin = getAllowedOrigin(origin);

    if (allowedOrigin) {
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      );
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });

  app.enableCors({
    origin: true,
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

  console.log(`Backend running at http://0.0.0.0:${port}/api/v1`);
  console.log('CORS mode: manual preflight middleware enabled');
}

bootstrap();