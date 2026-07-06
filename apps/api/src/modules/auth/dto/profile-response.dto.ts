import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  phone!: string | null;

  @ApiProperty()
  role!: string;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ required: false, nullable: true })
  lastLogin!: Date | null;
}
