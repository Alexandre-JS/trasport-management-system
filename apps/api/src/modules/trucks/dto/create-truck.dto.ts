import { TruckStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTruckDto {
  @ApiProperty({ example: 'AAA-001-MP' })
  @IsString()
  plateNumber!: string;

  @ApiPropertyOptional({ example: 'Mercedes-Benz' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Actros' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ enum: TruckStatus, default: TruckStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;
}
