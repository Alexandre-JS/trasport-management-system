import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTrailerDto {
  @ApiProperty()
  @IsUUID()
  trailerId!: string;
}
