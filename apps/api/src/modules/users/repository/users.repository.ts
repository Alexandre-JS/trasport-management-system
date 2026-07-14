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
