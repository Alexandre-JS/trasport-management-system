import { TruckStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateTruckStatusDto {
  @ApiProperty({ enum: TruckStatus })
  @IsEnum(TruckStatus)
  status!: TruckStatus;
}
