import { DriverStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ example: 'Carlos Mabunda' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'MZ-DRV-0001' })
  @IsString()
  licenseNumber!: string;

  @ApiPropertyOptional({ example: '+258840000002' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'driver@sgrtc.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: DriverStatus, default: DriverStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
