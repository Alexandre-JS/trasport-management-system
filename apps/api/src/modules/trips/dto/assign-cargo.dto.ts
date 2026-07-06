import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignCargoDto {
  @ApiProperty()
  @IsUUID()
  cargoId!: string;
}
