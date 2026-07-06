import { TruckStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class TruckResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plateNumber!: string;

  @ApiProperty({ required: false, nullable: true })
  brand!: string | null;

  @ApiProperty({ required: false, nullable: true })
  model!: string | null;

  @ApiProperty({ required: false, nullable: true })
  year!: number | null;

  @ApiProperty({ enum: TruckStatus })
  status!: TruckStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
