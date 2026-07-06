import { IncidentType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class IncidentTripCargoDto {
  @ApiProperty()
  code!: string;
}

class IncidentTripDriverDto {
  @ApiProperty()
  fullName!: string;
}

class IncidentTripDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: IncidentTripCargoDto })
  cargo!: IncidentTripCargoDto;

  @ApiProperty({ type: IncidentTripDriverDto })
  driver!: IncidentTripDriverDto;
}

export class IncidentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiProperty({ enum: IncidentType })
  type!: IncidentType;

  @ApiProperty({ required: false, nullable: true })
  description!: string | null;

  @ApiProperty({ required: false, nullable: true, example: -25.9655 })
  latitude!: number | null;

  @ApiProperty({ required: false, nullable: true, example: 32.5832 })
  longitude!: number | null;

  @ApiProperty({ required: false, nullable: true })
  photo!: string | null;

  @ApiProperty()
  reportedAt!: Date;

  @ApiProperty({ required: false, nullable: true })
  resolvedAt!: Date | null;

  @ApiProperty({ type: IncidentTripDto })
  trip!: IncidentTripDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
