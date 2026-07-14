import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuthUserEntity } from '../entities/auth-user.entity';

const authUserSelect = {
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
} as const;

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
      select: authUserSelect,
    });
  }

  /**
   * Procura contas ativas pelo telefone. A comparação usa os últimos 9
   * dígitos (números moçambicanos sem o indicativo +258) para o utilizador
   * poder escrever o número como o conhece. Devolve até 2 resultados para o
   * serviço detetar ambiguidade.
   */
  findActiveUsersByPhoneDigits(digits: string): Promise<AuthUserEntity[]> {
    const suffix = digits.slice(-9);

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        phone: { endsWith: suffix },
      },
      select: authUserSelect,
      take: 2,
    });
  }

  /** Login de motorista pelo nº da carta de condução (via conta associada). */
  async findActiveUserByLicenseNumber(
    licenseNumber: string,
  ): Promise<AuthUserEntity | null> {
    const driver = await this.prisma.driver.findFirst({
      where: { licenseNumber, deletedAt: null, userId: { not: null } },
      select: { userId: true },
    });

    if (!driver?.userId) {
      return null;
    }

    return this.findActiveUserById(driver.userId);
  }

  findActiveUserById(id: string): Promise<AuthUserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: authUserSelect,
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
