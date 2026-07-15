import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { AuthService } from './auth.service';

function firstMockArgument<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as unknown as Array<[T]>;
  const firstCall = calls[0];

  if (!firstCall) {
    throw new Error('Expected mock to have been called');
  }

  return firstCall[0];
}

describe('AuthService guest session', () => {
  const tx = {
    user: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const environment: Record<string, string> = {
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRES_IN: '900',
    JWT_REFRESH_EXPIRES_IN: '604800',
    BCRYPT_SALT_ROUNDS: '4',
  };

  const configService = {
    get: jest.fn((key: string) => environment[key]),
  };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
    configService as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );

    tx.user.create.mockImplementation((args: { data: { email: string } }) => ({
      id: 'guest-user-id',
      email: args.data.email,
      fullName: 'Guest',
      avatarUrl: null,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isGuest: true,
      lastLoginAt: new Date('2026-07-15T00:00:00.000Z'),
      createdAt: new Date('2026-07-15T00:00:00.000Z'),
      updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    }));

    tx.refreshToken.create.mockResolvedValue({});

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
  });

  it('creates an isolated guest user and issues an auth session', async () => {
    const result = await service.createGuest({
      userAgent: 'test-browser',
      ipAddress: '127.0.0.1',
    });

    const createUserInput = firstMockArgument<{
      data: {
        email: string;
        passwordHash: string;
        fullName: string;
        role: UserRole;
        status: UserStatus;
        isGuest: boolean;
      };
    }>(tx.user.create);

    expect(createUserInput.data).toMatchObject({
      fullName: 'Guest',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isGuest: true,
    });
    expect(createUserInput.data.email).toMatch(
      /^guest-[0-9a-f-]{36}@guest\.invalid$/,
    );
    expect(createUserInput.data.passwordHash).toEqual(expect.any(String));

    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
      user: {
        id: 'guest-user-id',
        email: createUserInput.data.email,
        isGuest: true,
      },
    });

    const refreshCreateInput = firstMockArgument<{
      data: {
        userId: string;
        jti: string;
        tokenHash: string;
        userAgent: string | null;
        ipAddress: string | null;
      };
    }>(tx.refreshToken.create);

    expect(refreshCreateInput.data).toMatchObject({
      userId: 'guest-user-id',
      userAgent: 'test-browser',
      ipAddress: '127.0.0.1',
    });
    expect(refreshCreateInput.data.jti).toMatch(/^[0-9a-f-]{36}$/);
    expect(refreshCreateInput.data.tokenHash).not.toBe('refresh-token');
    await expect(
      bcrypt.compare('refresh-token', refreshCreateInput.data.tokenHash),
    ).resolves.toBe(true);
  });
});
