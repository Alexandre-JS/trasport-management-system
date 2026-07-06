import { ApiProperty } from '@nestjs/swagger';

export class TrackingPointResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiProperty({ example: -25.9655 })
  latitude!: number;

  @ApiProperty({ example: 32.5832 })
  longitude!: number;

  @ApiProperty({ required: false, nullable: true, example: 62.5 })
  speed!: number | null;

  @ApiProperty({ required: false, nullable: true, example: 180 })
  heading!: number | null;

  @ApiProperty({ required: false, nullable: true, example: 5 })
  accuracy!: number | null;

  @ApiProperty()
  recordedAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
