import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBorderDto {
  @ApiProperty({ example: 'Chirundu' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Zâmbia' })
  @IsString()
  @MaxLength(80)
  countryA!: string;

  @ApiProperty({ example: 'Zimbabué' })
  @IsString()
  @MaxLength(80)
  countryB!: string;

  @ApiPropertyOptional({ example: -16.0333 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 28.85 })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
