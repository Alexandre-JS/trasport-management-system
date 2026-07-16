import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IsNormalizedEmail,
  IsPhone,
} from '../../../common/validation/validators';

/**
 * Cria uma conta de acesso mobile para um motorista: o sistema gera o código
 * de acesso (senha) e cria, na mesma transação, o utilizador (perfil Motorista)
 * e o registo operacional do motorista, já ligados. O login no mobile faz-se
 * com o telefone + o código gerado.
 */
export class CreateDriverAccountDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Nhamie' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({
    example: '+258 84 123 4567',
    description: 'Telefone do motorista — identificador de login no mobile',
  })
  @IsPhone()
  phone!: string;

  @ApiProperty({
    example: 'MZ-0012345',
    description: 'Nº da carta de condução',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  licenseNumber!: string;

  @ApiPropertyOptional({
    example: 'carlos@exemplo.com',
    description: 'Opcional — se vazio, o sistema gera um email interno',
  })
  @IsOptional()
  @IsNormalizedEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'AB123456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  passportNumber?: string;
}
