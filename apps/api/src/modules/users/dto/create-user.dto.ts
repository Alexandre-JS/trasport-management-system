import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsUUID()
  roleId!: string;

  @ApiProperty({
    required: false,
    description: 'Client this user represents (portal access)',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ example: 'Maria' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Mabunda' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'maria@sgrtc.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
