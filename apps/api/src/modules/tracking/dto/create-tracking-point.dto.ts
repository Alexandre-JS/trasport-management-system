import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateTrackingPointDto {
  @ApiProperty({ example: -25.9655, description: 'Latitude em graus decimais' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 32.5832, description: 'Longitude em graus decimais' })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 62.5, description: 'Velocidade em km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({
    example: 180,
    description: 'Direção em graus (0-360)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Precisão do sinal em metros',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({
    description:
      'Data/hora da posição em ISO 8601. Assume o momento atual se omitido.',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
