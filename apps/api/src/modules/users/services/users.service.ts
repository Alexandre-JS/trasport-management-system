import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';
import { CreateClientAccountDto } from '../dto/create-client-account.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.usersRepository.health();
  }

  async findAll(query: ListUsersQueryDto) {
    const { data, total } = await this.usersRepository.findMany(query);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureRoleExists(dto.roleId);
    await this.ensureEmailAvailable(dto.email);

    const password = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.create({
      ...dto,
      password,
      isActive: dto.isActive ?? true,
    });

    this.logger.log(`User created: ${user.id}`, UsersService.name);

    return user;
  }

  /** Provision a portal login for a client (resolves the CLIENT role server-side). */
  async createClientAccount(dto: CreateClientAccountDto) {
    await this.ensureEmailAvailable(dto.email);

    const roleId = await this.usersRepository.roleIdByName('CLIENT');
    if (!roleId) {
      throw new NotFoundException('CLIENT role is not configured');
    }

    if (!(await this.usersRepository.clientExists(dto.clientId))) {
      throw new NotFoundException('Client not found');
    }

    const password = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.create({
      roleId,
      clientId: dto.clientId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password,
      isActive: true,
    });

    this.logger.log(
      `Client account provisioned: ${user.id}`,
      UsersService.name,
    );

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);

    if (dto.roleId) {
      await this.ensureRoleExists(dto.roleId);
    }

    if (dto.email) {
      await this.ensureEmailAvailable(dto.email, id);
    }

    const user = await this.usersRepository.update(id, dto);

    this.logger.log(`User updated: ${user.id}`, UsersService.name);

    return user;
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    const user = await this.usersRepository.softDelete(id);

    this.logger.log(`User deleted: ${user.id}`, UsersService.name);

    return user;
  }

  async activate(id: string) {
    await this.ensureUserExists(id);
    const user = await this.usersRepository.setActive(id, true);

    this.logger.log(`User activated: ${user.id}`, UsersService.name);

    return user;
  }

  async deactivate(id: string) {
    await this.ensureUserExists(id);
    const user = await this.usersRepository.setActive(id, false);

    this.logger.log(`User deactivated: ${user.id}`, UsersService.name);

    return user;
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.ensureUserExists(id);
    const password = await bcrypt.hash(dto.newPassword, 12);
    await this.usersRepository.updatePassword(id, password);

    this.logger.log(`User password reset: ${id}`, UsersService.name);

    return { message: 'Password reset successfully' };
  }

  async changeRole(id: string, dto: ChangeUserRoleDto) {
    await this.ensureUserExists(id);
    await this.ensureRoleExists(dto.roleId);
    const user = await this.usersRepository.changeRole(id, dto.roleId);

    this.logger.log(`User role changed: ${user.id}`, UsersService.name);

    return user;
  }

  private async ensureUserExists(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureRoleExists(roleId: string) {
    const roleExists = await this.usersRepository.roleExists(roleId);

    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }
  }

  private async ensureEmailAvailable(email: string, currentUserId?: string) {
    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException('Email already in use');
    }
  }
}
