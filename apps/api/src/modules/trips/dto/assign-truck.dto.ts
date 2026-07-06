import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTruckDto {
  @ApiProperty()
  @IsUUID()
  truckId!: string;
}
