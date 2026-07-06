import { TrailerStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateTrailerStatusDto {
  @ApiProperty({ enum: TrailerStatus })
  @IsEnum(TrailerStatus)
  status!: TrailerStatus;
}
