import { TrailerStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class TrailerTruckDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plateNumber!: string;
}

export class TrailerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false, nullable: true })
  truckId!: string | null;

  @ApiProperty()
  plateNumber!: string;

  @ApiProperty({ required: false, nullable: true })
  brand!: string | null;

  @ApiProperty({ required: false, nullable: true })
  model!: string | null;

  @ApiProperty({ required: false, nullable: true })
  year!: number | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Decimal serialised as string',
  })
  tonnage!: string | null;

  @ApiProperty({ enum: TrailerStatus })
  status!: TrailerStatus;

  @ApiProperty({ type: TrailerTruckDto, required: false, nullable: true })
  truck!: TrailerTruckDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
