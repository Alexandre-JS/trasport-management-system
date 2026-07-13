import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuthUserEntity } from '../entities/auth-user.entity';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'auth', status: 'ready' };
  }

  findActiveUserByEmail(email: string): Promise<AuthUserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        role: {
          select: {
            name: true,
          },
        },
        driverProfile: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  findActiveUserById(id: string): Promise<AuthUserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        role: {
          select: {
            name: true,
          },
        },
        driverProfile: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  updateLastLogin(id: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id },
        data: { lastLogin: new Date() },
      })
      .then(() => undefined);
  }

  updatePassword(id: string, password: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id },
        data: { password },
      })
      .then(() => undefined);
  }

  createRefreshToken(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    return this.prisma.refreshToken
      .create({ data: input })
      .then(() => undefined);
  }

  findRefreshTokenById(id: string) {
    return this.prisma.refreshToken.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }

  revokeRefreshToken(id: string): Promise<void> {
    return this.prisma.refreshToken
      .updateMany({
        where: { id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .then(() => undefined);
  }

  /** Revoke every active refresh token for a user (logout / theft response). */
  revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    return this.prisma.refreshToken
      .updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .then(() => undefined);
  }
}
