import { ApiProperty } from '@nestjs/swagger';

class ClientHistoryTripDto {
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
}

class ClientHistoryCargoDto {
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

  @ApiProperty({ type: [ClientHistoryTripDto] })
  trips!: ClientHistoryTripDto[];
}

export class ClientHistoryResponseDto {
  @ApiProperty()
  clientId!: string;

  @ApiProperty({ type: [ClientHistoryCargoDto] })
  cargos!: ClientHistoryCargoDto[];
}
