import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client.js';
import type { Session } from './types.js';
import { REUSE_GRACE_MS } from './constants.js';

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

  async create(userId: number, client: Prisma.TransactionClient = this.prisma) {
    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    await client.refreshSession.create({
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

  async revoke(token: string, client: Prisma.TransactionClient = this.prisma) {
    const tokenHash = this.hashToken(token);
    await client.refreshSession.updateMany({
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

  async revokeAllForUser(
    userId: number,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    await client.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async verifyRefreshToken(
    rawToken: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<Session> {
    const hashtoken = this.hashToken(rawToken);
    const session = await client.refreshSession.findUnique({
      where: {
        tokenHash: hashtoken,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
    if (!session) {
      throw new HttpException('刷新令牌不存在', HttpStatus.UNAUTHORIZED);
    }
    if (session.revokedAt) {
      const elapsed = Date.now() - session.revokedAt.getTime();
      if (elapsed < REUSE_GRACE_MS) {
        // 并发请求，不清
        throw new HttpException('刷新令牌已被使用', HttpStatus.UNAUTHORIZED);
      }
      // 续签却令牌已经使用了很久，说明可能存在旧令牌被盗取的异常情况，撤销该用户所有会话
      await this.revokeAllForUser(session.userId, client);
      throw new HttpException('刷新令牌已撤销', HttpStatus.UNAUTHORIZED);
    }
    if (session.expiresAt < new Date()) {
      throw new HttpException('刷新令牌已过期', HttpStatus.UNAUTHORIZED);
    }
    return session;
  }

  async rotate(session: Session) {
    const res = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      if (count === 0)
        return {
          reused: true as const,
        };

      const newSession = await this.create(session.userId, tx);
      return { reused: false as const, ...newSession, user: session.user };
    });
    return res;
  }
}
