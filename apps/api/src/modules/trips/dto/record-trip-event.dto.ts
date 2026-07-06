import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripEventType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class RecordTripEventDto {
  @ApiProperty({ enum: TripEventType })
  @IsEnum(TripEventType)
  type!: TripEventType;

  @ApiPropertyOptional({ description: 'When the milestone happened (defaults to now)' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
