import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get refreshTokenTtlMs() {
    return (
      Number(this.configService.get<number>('REFRESH_TOKEN_TTL_DAYS')) *
      24 *
      60 *
      60 *
      1000
    );
  }

  private hashToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async create(userId: number) {
    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      refreshToken,
      expiresAt,
    };
  }

  async revoke(token: string) {
    const tokenHash = this.hashToken(token);
    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return;
  }
}
