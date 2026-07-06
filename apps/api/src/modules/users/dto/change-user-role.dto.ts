import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeUserRoleDto {
  @ApiProperty()
  @IsUUID()
  roleId!: string;
}
