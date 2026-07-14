import { CargoStatus, TripStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class CargoBorderRefDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class CargoTripBorderDto {
  @ApiProperty()
  sequence!: number;

  @ApiProperty({ required: false, nullable: true })
  arrivedAt!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  clearedAt!: Date | null;

  @ApiProperty({ type: CargoBorderRefDto })
  border!: CargoBorderRefDto;
}

class CargoClientDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyName!: string;
}

class CargoTripResourceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plateNumberOrName!: string;
}

class CargoTripDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TripStatus })
  currentStatus!: TripStatus;

  @ApiProperty({ required: false, nullable: true })
  departureDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalEstimate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  loadedDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  currentPosition!: string | null;

  @ApiProperty({ type: CargoTripBorderDto, isArray: true })
  borders!: CargoTripBorderDto[];

  @ApiProperty()
  driver!: CargoTripResourceDto;

  @ApiProperty()
  truck!: CargoTripResourceDto;

  @ApiProperty({ required: false, nullable: true })
  trailer!: CargoTripResourceDto | null;
}

export class CargoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clientId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ required: false, nullable: true })
  description!: string | null;

  @ApiProperty()
  type!: string;

  @ApiProperty({ required: false, nullable: true })
  containerNumber!: string | null;

  @ApiProperty({ required: false, nullable: true })
  weightTonnes!: number | null;

  @ApiProperty({ required: false, nullable: true })
  volumeM3!: number | null;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  destination!: string;

  @ApiProperty({ required: false, nullable: true })
  pickupDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  expectedDelivery!: Date | null;

  @ApiProperty({ enum: CargoStatus })
  status!: CargoStatus;

  @ApiProperty({ required: false, nullable: true })
  observations!: string | null;

  @ApiProperty({ type: CargoClientDto })
  client!: CargoClientDto;

  @ApiProperty({ type: CargoTripDto, isArray: true })
  trips!: CargoTripDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
