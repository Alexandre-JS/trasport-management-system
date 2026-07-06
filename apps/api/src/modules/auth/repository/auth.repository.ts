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
}
