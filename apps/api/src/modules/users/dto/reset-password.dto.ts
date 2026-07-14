import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validation/validators';

export class ResetPasswordDto {
  @ApiProperty({
    minLength: 8,
    description:
      'Mínimo 8 caracteres, com maiúsculas, minúsculas e números.',
  })
  @IsStrongPassword()
  newPassword!: string;
}
