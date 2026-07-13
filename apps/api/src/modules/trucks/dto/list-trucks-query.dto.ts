import { TruckStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListTrucksQueryDto {
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

  @ApiPropertyOptional({ enum: TruckStatus })
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Only trucks without an active trailer',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  withoutTrailer?: boolean;

  @ApiPropertyOptional({
    enum: ['createdAt', 'plateNumber', 'brand', 'model', 'status'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'plateNumber', 'brand', 'model', 'status'])
  sortBy: 'createdAt' | 'plateNumber' | 'brand' | 'model' | 'status' =
    'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
