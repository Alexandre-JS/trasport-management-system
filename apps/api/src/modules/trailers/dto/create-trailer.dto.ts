import { TrailerStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTrailerDto {
  @ApiPropertyOptional({
    description: 'Preferred or currently associated truck',
  })
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiProperty({ example: 'TRL-001-MP' })
  @IsString()
  plateNumber!: string;

  @ApiPropertyOptional({ example: 'Randon' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Semirreboque graneleiro' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 34 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tonnage?: number;

  @ApiPropertyOptional({
    enum: TrailerStatus,
    default: TrailerStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(TrailerStatus)
  status?: TrailerStatus;
}
