import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions =>
        ({
          secret: configService.get<string>(
            'jwt.accessSecret',
            'change-me-access-secret',
          ),
          signOptions: {
            expiresIn: configService.get<string>('jwt.accessExpiresIn', '15m'),
          },
        }) as JwtModuleOptions,
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, PermissionsGuard],
  exports: [
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthCoreModule {}
