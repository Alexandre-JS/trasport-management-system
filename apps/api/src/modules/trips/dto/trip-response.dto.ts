import { TripEventType, TripStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TripBorderBorderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  countryA!: string;

  @ApiProperty()
  countryB!: string;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Decimal serialised as string',
  })
  lat!: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Decimal serialised as string',
  })
  lng!: string | null;
}

class TripBorderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description: 'Position of this crossing in the route (1-based)',
  })
  sequence!: number;

  @ApiProperty({ required: false, nullable: true })
  arrivedAt!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  clearedAt!: Date | null;

  @ApiProperty({ type: TripBorderBorderDto })
  border!: TripBorderBorderDto;
}

class TripCargoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clientId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  destination!: string;
}

class TripDriverDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiProperty({ required: false, nullable: true })
  passportNumber!: string | null;
}

class TripTruckDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plateNumber!: string;
}

class TripTrailerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plateNumber!: string;
}

class TripEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TripEventType })
  type!: TripEventType;

  @ApiProperty()
  occurredAt!: Date;

  @ApiProperty({ enum: TripStatus, required: false, nullable: true })
  fromStatus!: TripStatus | null;

  @ApiProperty({ enum: TripStatus, required: false, nullable: true })
  toStatus!: TripStatus | null;

  @ApiProperty({ required: false, nullable: true })
  note!: string | null;

  @ApiProperty({ required: false, nullable: true })
  createdBy!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class TripResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cargoId!: string;

  @ApiProperty()
  truckId!: string;

  @ApiProperty({ required: false, nullable: true })
  trailerId!: string | null;

  @ApiProperty()
  driverId!: string;

  @ApiProperty({ required: false, nullable: true })
  departureDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalEstimate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  arrivalDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  loadedDate!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  dischargeDate!: Date | null;

  @ApiProperty({ enum: TripStatus })
  currentStatus!: TripStatus;

  @ApiProperty({ required: false, nullable: true })
  currentPosition!: string | null;

  @ApiProperty({
    type: TripBorderDto,
    isArray: true,
    description: 'Border crossings of the route, in sequence order',
  })
  borders!: TripBorderDto[];

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Decimal serialised as string',
  })
  tonnage!: string | null;

  @ApiProperty({ required: false, nullable: true })
  transporterName!: string | null;

  @ApiProperty()
  isSubcontracted!: boolean;

  @ApiProperty({ required: false, nullable: true })
  dispatchedBy!: string | null;

  @ApiProperty({ required: false, nullable: true })
  remarks!: string | null;

  @ApiProperty({ required: false, nullable: true })
  horsePlate!: string | null;

  @ApiProperty({ required: false, nullable: true })
  trailerPlate!: string | null;

  @ApiProperty({ required: false, nullable: true })
  driverName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  driverPassport!: string | null;

  @ApiProperty({ required: false, nullable: true })
  driverLicense!: string | null;

  @ApiProperty({ required: false, nullable: true })
  driverPhone!: string | null;

  @ApiProperty({ required: false, nullable: true })
  bookingReference!: string | null;

  @ApiProperty({ type: TripCargoDto })
  cargo!: TripCargoDto;

  @ApiProperty({ type: TripDriverDto })
  driver!: TripDriverDto;

  @ApiProperty({ type: TripTruckDto })
  truck!: TripTruckDto;

  @ApiProperty({ type: TripTrailerDto, required: false, nullable: true })
  trailer!: TripTrailerDto | null;

  @ApiPropertyOptional({
    description: 'Opaque public tracking token — present on the trip detail',
  })
  trackingToken?: string;

  @ApiPropertyOptional({
    type: TripEventDto,
    isArray: true,
    description: 'Event history — present on the trip detail (GET /trips/:id)',
  })
  events?: TripEventDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
