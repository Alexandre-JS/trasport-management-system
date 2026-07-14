import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import {
  IsNormalizedEmail,
  IsStrongPassword,
} from '../../../common/validation/validators';

export class CreateClientAccountDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiProperty({ example: 'Maria' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Banda' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'maria@cliente.local' })
  @IsNormalizedEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsStrongPassword()
  password!: string;
}
