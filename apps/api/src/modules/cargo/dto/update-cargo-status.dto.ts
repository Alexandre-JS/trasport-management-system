import { CargoStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateCargoStatusDto {
  @ApiProperty({ enum: CargoStatus })
  @IsEnum(CargoStatus)
  status!: CargoStatus;
}
