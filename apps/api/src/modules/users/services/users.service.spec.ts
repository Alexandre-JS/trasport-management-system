import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { UsersRepository } from '../repository/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const usersRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    roleExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    changeRole: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const user = {
    id: 'user-id',
    roleId: 'role-id',
    firstName: 'Maria',
    lastName: 'Mabunda',
    email: 'maria@sgrtc.local',
    phone: null,
    isActive: true,
    lastLogin: null,
    role: {
      id: 'role-id',
      name: 'ADMIN',
      description: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(usersRepository, logger);
  });

  it('lists users with pagination metadata', async () => {
    usersRepository.findMany.mockResolvedValue({ data: [user], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('creates a user when role exists and email is available', async () => {
    usersRepository.roleExists.mockResolvedValue(true);
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue(user);

    const result = await service.create({
      roleId: 'role-id',
      firstName: 'Maria',
      lastName: 'Mabunda',
      email: 'maria@sgrtc.local',
      password: 'Strong@123',
    });

    expect(result.id).toBe('user-id');
    expect(usersRepository.create.mock.calls[0][0].password).not.toBe(
      'Strong@123',
    );
  });

  it('rejects duplicate email on create', async () => {
    usersRepository.roleExists.mockResolvedValue(true);
    usersRepository.findByEmail.mockResolvedValue(user);

    await expect(
      service.create({
        roleId: 'role-id',
        firstName: 'Maria',
        lastName: 'Mabunda',
        email: 'maria@sgrtc.local',
        password: 'Strong@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects role changes to an unknown role', async () => {
    usersRepository.findById.mockResolvedValue(user);
    usersRepository.roleExists.mockResolvedValue(false);

    await expect(
      service.changeRole('user-id', { roleId: 'missing-role' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
