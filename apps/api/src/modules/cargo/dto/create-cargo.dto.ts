import { CargoStatus, CargoType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCargoDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CargoType, default: CargoType.GRANEL })
  @IsOptional()
  @IsEnum(CargoType)
  type?: CargoType;

  // Número do container é obrigatório quando o tipo é CONTAINER e ignorado
  // (não pode vir preenchido) quando é GRANEL.
  @ApiPropertyOptional({ example: 'MSKU1234567' })
  @ValidateIf((dto: CreateCargoDto) => dto.type === CargoType.CONTAINER)
  @IsString()
  containerNumber?: string;

  @ApiPropertyOptional({ example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightTonnes?: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeM3?: number;

  @ApiProperty({ example: 'Maputo' })
  @IsString()
  origin!: string;

  @ApiProperty({ example: 'Beira' })
  @IsString()
  destination!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ enum: CargoStatus, default: CargoStatus.CREATED })
  @IsOptional()
  @IsEnum(CargoStatus)
  status?: CargoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
