import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType } from '@prisma/client';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReportDriverIncidentDto {
  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  type!: IncidentType;

  @ApiPropertyOptional({ description: 'Descrição do incidente' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
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
  @MaxLength(1_500_000)
  photo?: string;
}
