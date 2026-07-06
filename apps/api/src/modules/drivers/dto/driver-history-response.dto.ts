import { ApiProperty } from '@nestjs/swagger';

class DriverHistoryCargoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  destination!: string;

  @ApiProperty()
  status!: string;
}

class DriverHistoryTripDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  currentStatus!: string;

  @ApiProperty({ required: false, nullable: true })
  departureDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalEstimate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalDate!: Date | null;

  @ApiProperty({ type: DriverHistoryCargoDto })
  cargo!: DriverHistoryCargoDto;
}

export class DriverHistoryResponseDto {
  @ApiProperty()
  driverId!: string;

  @ApiProperty({ type: [DriverHistoryTripDto] })
  trips!: DriverHistoryTripDto[];
}
