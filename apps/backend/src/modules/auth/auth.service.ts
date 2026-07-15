import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../libs/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import type { RequestMeta } from './interfaces/request-meta.interface';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  isGuest: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SafeUser = Prisma.UserGetPayload<{ select: typeof SAFE_USER_SELECT }>;
type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, requestMeta: RequestMeta) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.getSaltRounds());

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
      },
      select: SAFE_USER_SELECT,
    });

    return this.issueAuthTokens(user, requestMeta);
  }

  async login(dto: LoginDto, requestMeta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản chưa hoạt động hoặc đã bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const safeUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: SAFE_USER_SELECT,
    });

    return this.issueAuthTokens(safeUser, requestMeta);
  }

  async createGuest(requestMeta: RequestMeta) {
    const guestIdentity = randomUUID();
    const passwordHash = await bcrypt.hash(randomUUID(), this.getSaltRounds());

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: `guest-${guestIdentity}@guest.invalid`,
          fullName: 'Guest',
          passwordHash,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          isGuest: true,
          lastLoginAt: new Date(),
        },
        select: SAFE_USER_SELECT,
      });

      return this.issueAuthTokens(user, requestMeta, tx);
    });
  }

  async refresh(refreshToken: string, requestMeta: RequestMeta) {
    const payload = await this.verifyRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
      include: {
        user: {
          select: SAFE_USER_SELECT,
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const isTokenMatch = await bcrypt.compare(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!isTokenMatch) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản không còn hoạt động');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const latestUser = await tx.user.findUniqueOrThrow({
        where: { id: storedToken.userId },
        select: SAFE_USER_SELECT,
      });

      return this.issueAuthTokens(latestUser, requestMeta, tx);
    });
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { jti: payload.jti },
      });

      if (!storedToken) {
        return { message: 'Đăng xuất thành công' };
      }

      const isTokenMatch = await bcrypt.compare(
        refreshToken,
        storedToken.tokenHash,
      );

      if (!isTokenMatch) {
        return { message: 'Đăng xuất thành công' };
      }

      if (!storedToken.revokedAt) {
        await this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        });
      }

      return { message: 'Đăng xuất thành công' };
    } catch {
      return { message: 'Đăng xuất thành công' };
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản không còn hoạt động');
    }

    return user;
  }

  private async issueAuthTokens(
    user: SafeUser,
    requestMeta: RequestMeta,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    const accessToken = await this.signAccessToken(user);
    const refresh = await this.createRefreshToken(
      user.id,
      requestMeta,
      prismaClient,
    );

    return {
      user,
      accessToken,
      refreshToken: refresh.token,
      accessTokenExpiresIn: this.getAccessTokenTtlSeconds(),
      refreshTokenExpiresIn: this.getRefreshTokenTtlSeconds(),
    };
  }

  private async signAccessToken(user: SafeUser) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      {
        secret: this.getRequiredStringEnv('JWT_ACCESS_SECRET'),
        expiresIn: this.getAccessTokenTtlSeconds(),
      },
    );
  }

  private async createRefreshToken(
    userId: string,
    requestMeta: RequestMeta,
    prismaClient: PrismaClientLike,
  ) {
    const jti = randomUUID();
    const refreshTokenTtlSeconds = this.getRefreshTokenTtlSeconds();

    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        jti,
        type: 'refresh',
      },
      {
        secret: this.getRequiredStringEnv('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenTtlSeconds,
      },
    );

    const tokenHash = await bcrypt.hash(token, this.getSaltRounds());

    await prismaClient.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshTokenTtlSeconds * 1000),
        userAgent: requestMeta.userAgent,
        ipAddress: requestMeta.ipAddress,
      },
    });

    return { token };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.getRequiredStringEnv('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private getAccessTokenTtlSeconds() {
    return this.getNumberEnv('JWT_ACCESS_EXPIRES_IN', 900);
  }

  private getRefreshTokenTtlSeconds() {
    return this.getNumberEnv('JWT_REFRESH_EXPIRES_IN', 604800);
  }

  private getSaltRounds() {
    return this.getNumberEnv('BCRYPT_SALT_ROUNDS', 10);
  }

  private getRequiredStringEnv(key: string) {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }

  private getNumberEnv(key: string, fallback: number) {
    const raw = this.configService.get<string>(key);

    if (!raw) {
      return fallback;
    }

    const value = Number(raw);

    if (Number.isNaN(value)) {
      throw new Error(`${key} must be a number`);
    }

    return value;
  }
}
