import { TripStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty()
  @IsUUID()
  cargoId!: string;

  @ApiProperty()
  @IsUUID()
  truckId!: string;

  @ApiProperty()
  @IsUUID()
  trailerId!: string;

  @ApiProperty()
  @IsUUID()
  driverId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  arrivalEstimate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({
    enum: TripStatus,
    default: TripStatus.WAITING_APPOINTMENT,
  })
  @IsOptional()
  @IsEnum(TripStatus)
  currentStatus?: TripStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Ids of the border posts the route crosses, in order',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  borderIds?: string[];
}
