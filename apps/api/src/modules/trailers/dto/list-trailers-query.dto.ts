import { TrailerStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListTrailersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional({ enum: TrailerStatus })
  @IsOptional()
  @IsEnum(TrailerStatus)
  status?: TrailerStatus;

  @ApiPropertyOptional({
    enum: ['createdAt', 'plateNumber', 'brand', 'model', 'tonnage', 'status'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'plateNumber', 'brand', 'model', 'tonnage', 'status'])
  sortBy:
    'createdAt' | 'plateNumber' | 'brand' | 'model' | 'tonnage' | 'status' =
    'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
