import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validation/validators';

export class ChangePasswordDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({
    minLength: 8,
    description:
      'Mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.',
  })
  @IsStrongPassword()
  newPassword!: string;
}
