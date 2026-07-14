import { DriverStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  IsNormalizedEmail,
  IsPhone,
} from '../../../common/validation/validators';

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

  @ApiPropertyOptional({ example: 'AB1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  passportNumber?: string;

  @ApiPropertyOptional({ example: '+258840000002' })
  @IsOptional()
  @IsPhone()
  phone?: string;

  @ApiPropertyOptional({ example: 'driver@sgrtc.local' })
  @IsOptional()
  @IsNormalizedEmail()
  email?: string;

  @ApiPropertyOptional({ enum: DriverStatus, default: DriverStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
