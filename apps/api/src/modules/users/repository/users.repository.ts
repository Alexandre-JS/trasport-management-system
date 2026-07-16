import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';

const userSelect = {
  id: true,
  roleId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
  lastLogin: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'users', status: 'ready' };
  }

  listRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async findMany(query: ListUsersQueryDto): Promise<{
    data: UserEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: userSelect,
    });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: userSelect,
    });
  }

  roleExists(roleId: string): Promise<boolean> {
    return this.prisma.role
      .count({
        where: {
          id: roleId,
          deletedAt: null,
        },
      })
      .then((count) => count > 0);
  }

  create(data: CreateUserDto & { password: string }): Promise<UserEntity> {
    return this.prisma.user.create({
      data,
      select: userSelect,
    });
  }

  roleIdByName(name: string): Promise<string | null> {
    return this.prisma.role
      .findUnique({ where: { name }, select: { id: true } })
      .then((role) => role?.id ?? null);
  }

  /** Telefone já usado por outra conta (login por telefone tem de ser único). */
  async phoneInUse(phone: string): Promise<boolean> {
    const suffix = phone.replace(/\D/g, '').slice(-9);
    if (!suffix) return false;
    const count = await this.prisma.user.count({
      where: { deletedAt: null, phone: { endsWith: suffix } },
    });
    return count > 0;
  }

  async licenseInUse(licenseNumber: string): Promise<boolean> {
    const count = await this.prisma.driver.count({
      where: { licenseNumber, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Cria o utilizador (perfil Motorista) e o registo do motorista numa só
   * transação, já ligados pelo userId. Devolve o utilizador criado.
   */
  createDriverAccount(params: {
    roleId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    fullName: string;
    licenseNumber: string;
    passportNumber?: string;
  }): Promise<UserEntity> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          roleId: params.roleId,
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          phone: params.phone,
          password: params.password,
          isActive: true,
        },
        select: userSelect,
      });

      await tx.driver.create({
        data: {
          userId: user.id,
          fullName: params.fullName,
          licenseNumber: params.licenseNumber,
          passportNumber: params.passportNumber ?? null,
          phone: params.phone,
          email: params.email,
        },
        select: { id: true },
      });

      return user;
    });
  }

  findDriverForAccess(id: string) {
    return this.prisma.driver.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });
  }

  provisionExistingDriverAccount(params: {
    driverId: string;
    roleId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserEntity> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          roleId: params.roleId,
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          phone: params.phone,
          password: params.password,
          isActive: true,
        },
        select: userSelect,
      });

      await tx.driver.update({
        where: { id: params.driverId },
        data: {
          userId: user.id,
          phone: params.phone,
          email: params.email,
        },
      });

      return user;
    });
  }

  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clientExists(clientId: string): Promise<boolean> {
    return this.prisma.client
      .count({ where: { id: clientId, deletedAt: null } })
      .then((count) => count > 0);
  }

  emailExists(email: string): Promise<boolean> {
    return this.prisma.user
      .count({ where: { email } })
      .then((count) => count > 0);
  }

  update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  setActive(id: string, isActive: boolean): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
    });
  }

  changeRole(id: string, roleId: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: { roleId },
      select: userSelect,
    });
  }

  updatePassword(id: string, password: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id },
        data: { password },
      })
      .then(() => undefined);
  }

  softDelete(id: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: userSelect,
    });
  }

  private buildWhere(query: ListUsersQueryDto): Prisma.UserWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.role
        ? {
            role: {
              name: query.role,
            },
          }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
  }
}
