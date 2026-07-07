import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

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
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'A nova palavra-passe deve conter maiúsculas, minúsculas e números.',
  })
  newPassword!: string;
}
