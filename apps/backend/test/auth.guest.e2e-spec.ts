import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';

interface GuestAuthResponseBody {
  user: {
    id: string;
    email: string;
    isGuest: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

function isGuestAuthResponseBody(
  value: unknown,
): value is GuestAuthResponseBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const body = value as Partial<GuestAuthResponseBody>;

  return (
    typeof body.accessToken === 'string' &&
    typeof body.refreshToken === 'string' &&
    typeof body.user === 'object' &&
    body.user !== null &&
    typeof body.user.id === 'string' &&
    typeof body.user.email === 'string' &&
    body.user.isGuest === true
  );
}

describe('Guest auth (e2e)', () => {
  let app: INestApplication;

  const createGuest = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            createGuest,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createGuest.mockResolvedValue({
      user: {
        id: 'guest-user-id',
        email: 'guest-id@guest.invalid',
        isGuest: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/guest (POST)', async () => {
    const httpServer = app.getHttpServer() as Server;

    const response = await request(httpServer)
      .post('/api/v1/auth/guest')
      .set('user-agent', 'guest-e2e-browser')
      .set('x-forwarded-for', '203.0.113.10, 198.51.100.1')
      .expect(201);

    expect(createGuest).toHaveBeenCalledWith({
      userAgent: 'guest-e2e-browser',
      ipAddress: '203.0.113.10',
    });

    const body: unknown = response.body;

    if (!isGuestAuthResponseBody(body)) {
      throw new Error('Guest auth response body is invalid');
    }

    expect(body).toMatchObject({
      user: {
        id: 'guest-user-id',
        isGuest: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
