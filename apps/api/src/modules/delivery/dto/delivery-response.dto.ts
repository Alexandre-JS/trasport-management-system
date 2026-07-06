import { ApiProperty } from '@nestjs/swagger';

export class DeliveryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiProperty({ required: false, nullable: true })
  receiverName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  receiverDocument!: string | null;

  @ApiProperty({ required: false, nullable: true })
  deliveryPhoto!: string | null;

  @ApiProperty({ required: false, nullable: true })
  signature!: string | null;

  @ApiProperty({ required: false, nullable: true })
  deliveredAt!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  observations!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
