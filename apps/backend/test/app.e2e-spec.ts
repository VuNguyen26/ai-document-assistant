import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from './../src/app.module';

interface HealthLiveResponseBody {
  status: string;
}

function isHealthLiveResponseBody(
  value: unknown,
): value is HealthLiveResponseBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    typeof value.status === 'string'
  );
}

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health/live (GET)', async () => {
    const httpServer = app.getHttpServer() as Server;

    const response = await request(httpServer)
      .get('/api/v1/health/live')
      .expect(200);

    const body: unknown = response.body;

    if (!isHealthLiveResponseBody(body)) {
      throw new Error('Health response body is invalid');
    }

    expect(body.status).toBe('ok');
  });
});
