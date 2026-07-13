import { ApiProperty } from '@nestjs/swagger';

export class BorderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  countryA!: string;

  @ApiProperty()
  countryB!: string;

  @ApiProperty({ required: false, nullable: true })
  lat!: string | null;

  @ApiProperty({ required: false, nullable: true })
  lng!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
