import { TripStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

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
}
