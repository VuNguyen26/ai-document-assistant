import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseAllowedOrigins(frontendUrl?: string) {
  return [
    frontendUrl,
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://ai-document-assistant-tau.vercel.app',
  ]
    .filter(Boolean)
    .map((origin) => origin!.replace(/\/$/, ''));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? Number(process.env.PORT) ?? 4000;
  const frontendUrl =
    configService.get<string>('app.frontendUrl') ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000';

  const allowedOrigins = parseAllowedOrigins(frontendUrl);

  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
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
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();