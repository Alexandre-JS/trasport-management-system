import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'admin@sgrtc.local',
    description:
      'Email, número de telefone ou nº da carta de condução (motoristas)',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  /** @deprecated Compatibilidade com clientes antigos — usar `identifier`. */
  @ApiPropertyOptional({ example: 'admin@sgrtc.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Admin@12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
