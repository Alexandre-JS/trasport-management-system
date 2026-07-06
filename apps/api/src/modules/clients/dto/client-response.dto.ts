import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyName!: string;

  @ApiProperty({ required: false, nullable: true })
  contactName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  nuit!: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone!: string | null;

  @ApiProperty({ required: false, nullable: true })
  email!: string | null;

  @ApiProperty({ required: false, nullable: true })
  address!: string | null;

  @ApiProperty({ required: false, nullable: true })
  city!: string | null;

  @ApiProperty({ required: false, nullable: true })
  province!: string | null;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
