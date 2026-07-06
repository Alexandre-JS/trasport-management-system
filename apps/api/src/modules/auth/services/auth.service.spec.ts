import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const authRepository = {
    findActiveUserByEmail: jest.fn(),
    findActiveUserById: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
    health: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
  const configService = {
    get: jest.fn((_key: string, fallback?: string) => fallback),
  } as unknown as jest.Mocked<ConfigService>;

  const user = {
    id: 'user-id',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@sgrtc.local',
    password: '',
    phone: null,
    isActive: true,
    lastLogin: null,
    role: {
      name: 'ADMIN',
    },
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new AuthService(authRepository, jwtService, configService);
    user.password = await bcrypt.hash('Admin@12345', 4);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
  });

  it('authenticates valid credentials and returns tokens', async () => {
    authRepository.findActiveUserByEmail.mockResolvedValue(user);
    authRepository.updateLastLogin.mockResolvedValue(undefined);

    const result = await service.login({
      email: 'admin@sgrtc.local',
      password: 'Admin@12345',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('admin@sgrtc.local');
    expect(authRepository.updateLastLogin.mock.calls).toContainEqual([
      'user-id',
    ]);
  });

  it('rejects invalid credentials', async () => {
    authRepository.findActiveUserByEmail.mockResolvedValue(user);

    await expect(
      service.login({
        email: 'admin@sgrtc.local',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
