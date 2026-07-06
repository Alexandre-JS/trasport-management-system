import { Border, TripEventType, TripStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TripCargoDto {
  @ApiProperty()
  id!: string;

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

  @ApiProperty({ enum: TripStatus })
  currentStatus!: TripStatus;

  @ApiProperty({ required: false, nullable: true })
  currentPosition!: string | null;

  @ApiProperty({ enum: Border, required: false, nullable: true })
  border!: Border | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Decimal serialised as string',
  })
  tonnage!: string | null;

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
