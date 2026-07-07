import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { AuthenticatedUser } from '../../../core/auth/interfaces/authenticated-user.interface';
import { JwtPayload } from '../../../core/auth/interfaces/jwt-payload.interface';
import { getPermissionsForRole } from '../../../core/auth/permissions';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { AuthRepository } from '../repository/auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  health() {
    return this.authRepository.health();
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findActiveUserByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authRepository.updateLastLogin(user.id);

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const record = await this.authRepository.findRefreshTokenById(payload.jti);

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: a token that was already rotated (revoked) is being
    // replayed. Treat it as theft and revoke the whole family.
    if (record.revokedAt) {
      await this.authRepository.revokeAllRefreshTokensForUser(record.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const presentedHash = this.hashToken(dto.refreshToken);

    if (
      record.tokenHash !== presentedHash ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findActiveUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: invalidate the presented token before issuing a new pair.
    await this.authRepository.revokeRefreshToken(record.id);

    return this.buildAuthResponse(user);
  }

  async logout(currentUser: AuthenticatedUser) {
    await this.authRepository.revokeAllRefreshTokensForUser(currentUser.id);
    return { message: 'Logout successful' };
  }

  async getProfile(currentUser: AuthenticatedUser) {
    const user = await this.authRepository.findActiveUserById(currentUser.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return this.toProfile(user);
  }

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    const user = await this.authRepository.findActiveUserById(currentUser.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    const currentPasswordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!currentPasswordMatches) {
      throw new ForbiddenException('Current password is invalid');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new ForbiddenException(
        'New password must be different from the current password',
      );
    }

    const nextPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.authRepository.updatePassword(user.id, nextPassword);

    // A password change invalidates all existing sessions.
    await this.authRepository.revokeAllRefreshTokensForUser(user.id);

    return { message: 'Password changed successfully' };
  }

  private async buildAuthResponse(user: AuthUserEntity) {
    const permissions = getPermissionsForRole(user.role.name);
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user, permissions, 'access'),
      this.signToken(user, permissions, 'refresh', refreshTokenId),
    ]);

    const decoded = this.jwtService.decode(refreshToken) as {
      exp: number;
    } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      id: refreshTokenId,
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toProfile(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signToken(
    user: AuthUserEntity,
    permissions: string[],
    tokenType: 'access' | 'refresh',
    jti?: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
      tokenType,
      ...(jti ? { jti } : {}),
    };
    const secret =
      tokenType === 'access'
        ? this.configService.get<string>(
            'jwt.accessSecret',
            'change-me-access-secret',
          )
        : this.configService.get<string>(
            'jwt.refreshSecret',
            'change-me-refresh-secret',
          );
    const expiresIn =
      tokenType === 'access'
        ? this.configService.get<string>('jwt.accessExpiresIn', '15m')
        : this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    } as JwtSignOptions);
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>(
          'jwt.refreshSecret',
          'change-me-refresh-secret',
        ),
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private toProfile(user: AuthUserEntity) {
    const role = user.role.name;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role,
      permissions: getPermissionsForRole(role),
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      driverId: user.driverProfile?.id ?? null,
    };
  }
}
