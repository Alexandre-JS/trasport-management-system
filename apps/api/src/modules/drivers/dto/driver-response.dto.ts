import { DriverStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class DriverResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false, nullable: true })
  userId!: string | null;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiProperty({ required: false, nullable: true })
  passportNumber!: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone!: string | null;

  @ApiProperty({ required: false, nullable: true })
  email!: string | null;

  @ApiProperty({ enum: DriverStatus })
  status!: DriverStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
