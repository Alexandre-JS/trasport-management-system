import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

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
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
