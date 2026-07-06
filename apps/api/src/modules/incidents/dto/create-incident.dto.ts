import { IncidentType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty()
  @IsUUID()
  tripId!: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  type!: IncidentType;

  @ApiPropertyOptional({ description: 'Descrição do incidente' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: -25.9655 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 32.5832 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Fotografia do incidente (URL ou conteúdo em base64)',
  })
  @IsOptional()
  @IsString()
  photo?: string;
}
