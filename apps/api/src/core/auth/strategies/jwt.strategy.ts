import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getPermissionsForRole } from '../permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    // Re-validate against the database on every request so that deactivated,
    // deleted, or role-changed users lose access immediately instead of
    // remaining authorized until the access token expires.
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is no longer active');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions: getPermissionsForRole(user.role.name),
    };
  }
}
