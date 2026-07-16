import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';
import { CreateClientAccountDto } from '../dto/create-client-account.dto';
import { CreateDriverAccountDto } from '../dto/create-driver-account.dto';
import { ProvisionDriverAccessDto } from '../dto/provision-driver-access.dto';
import { CreateUserDto } from '../dto/create-user.dto';

// Alfabeto sem caracteres ambíguos (I, L, O, 0, 1) — código fácil de ditar.
const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateAccessCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ACCESS_CODE_ALPHABET[randomInt(ACCESS_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Guarda o telefone com os dígitos contíguos (mantendo o `+`): o login por
 * telefone compara os últimos 9 dígitos com `endsWith`, que quebra se o número
 * tiver espaços/separadores.
 */
function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return prefix + trimmed.replace(/\D/g, '');
}
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

  listRoles() {
    return this.usersRepository.listRoles();
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

  /**
   * Cria uma conta de acesso mobile para um motorista: gera o código de
   * acesso (senha) e cria o utilizador Motorista + registo do motorista,
   * ligados. Devolve a conta com o código em texto (mostrado uma única vez).
   */
  async createDriverAccount(dto: CreateDriverAccountDto) {
    const roleId = await this.usersRepository.roleIdByName('DRIVER');
    if (!roleId) {
      throw new NotFoundException('Perfil Motorista não está configurado');
    }

    if (await this.usersRepository.licenseInUse(dto.licenseNumber)) {
      throw new ConflictException(
        'Já existe um motorista com este nº de carta de condução',
      );
    }

    const phone = normalizePhone(dto.phone);
    if (await this.usersRepository.phoneInUse(phone)) {
      throw new ConflictException(
        'Este telefone já está associado a outra conta',
      );
    }

    let email = dto.email?.trim();
    if (email) {
      await this.ensureEmailAvailable(email);
    } else {
      email = await this.generateInternalDriverEmail();
    }

    const accessCode = generateAccessCode();
    const password = await bcrypt.hash(accessCode, 12);
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();

    const user = await this.usersRepository.createDriverAccount({
      roleId,
      firstName,
      lastName,
      email,
      phone,
      password,
      fullName: `${firstName} ${lastName}`.trim(),
      licenseNumber: dto.licenseNumber.trim(),
      passportNumber: dto.passportNumber?.trim(),
    });

    this.logger.log(`Driver account created: ${user.id}`, UsersService.name);

    return { ...user, accessCode };
  }

  async provisionDriverAccess(driverId: string, dto: ProvisionDriverAccessDto) {
    const driver = await this.usersRepository.findDriverForAccess(driverId);
    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }
    if (driver.userId) {
      throw new ConflictException('Este motorista já possui acesso mobile');
    }

    const roleId = await this.usersRepository.roleIdByName('DRIVER');
    if (!roleId) {
      throw new NotFoundException('Perfil Motorista não está configurado');
    }

    const phone = normalizePhone(dto.phone);
    if (await this.usersRepository.phoneInUse(phone)) {
      throw new ConflictException(
        'Este telefone já está associado a outra conta',
      );
    }

    let email = dto.email?.trim();
    if (email) {
      await this.ensureEmailAvailable(email);
    } else {
      email = await this.generateInternalDriverEmail();
    }

    const [firstName, ...remainingNames] = driver.fullName.trim().split(/\s+/);
    const lastName = remainingNames.join(' ') || firstName;
    const accessCode = generateAccessCode();
    const password = await bcrypt.hash(accessCode, 12);
    const user = await this.usersRepository.provisionExistingDriverAccount({
      driverId,
      roleId,
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    this.logger.log(
      `Mobile access provisioned for driver: ${driverId}`,
      UsersService.name,
    );

    return { ...user, accessCode };
  }

  /** Gera um novo código de acesso para um motorista e encerra as sessões. */
  async regenerateAccessCode(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }
    if (user.role.name !== 'DRIVER') {
      throw new BadRequestException(
        'O código de acesso só se aplica a contas de motorista',
      );
    }

    const accessCode = generateAccessCode();
    const password = await bcrypt.hash(accessCode, 12);
    await this.usersRepository.updatePassword(id, password);
    // Um novo código invalida as sessões antigas na app.
    await this.usersRepository.revokeRefreshTokens(id);

    this.logger.log(`Driver access code regenerated: ${id}`, UsersService.name);

    return { accessCode };
  }

  private async generateInternalDriverEmail(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const email = `motorista.${randomBytes(4).toString('hex')}@lumac.local`;
      if (!(await this.usersRepository.emailExists(email))) {
        return email;
      }
    }
    throw new ConflictException('Não foi possível gerar um email interno');
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
