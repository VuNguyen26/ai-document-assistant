import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../libs/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLive() {
    return {
      status: 'ok',
      service: 'ai-document-assistant-backend',
      timestamp: new Date().toISOString(),
      uptimeInSeconds: Math.floor(process.uptime()),
    };
  }

  async getReady() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        service: 'ai-document-assistant-backend',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'ai-document-assistant-backend',
        database: 'down',
        timestamp: new Date().toISOString(),
        message: 'Database is not ready',
      });
    }
  }
}
