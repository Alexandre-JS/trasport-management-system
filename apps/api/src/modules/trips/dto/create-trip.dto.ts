import { TripStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  loadedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  currentPosition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tonnage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  transporterName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSubcontracted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  dispatchedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  horsePlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  trailerPlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPassport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  driverLicense?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bookingReference?: string;

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
