import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  IsNormalizedEmail,
  IsPhone,
} from '../../../common/validation/validators';

export class ProvisionDriverAccessDto {
  @ApiProperty({
    example: '+258 84 123 4567',
    description: 'Telefone usado como identificador no login mobile',
  })
  @IsPhone()
  phone!: string;

  @ApiPropertyOptional({ description: 'Email opcional do motorista' })
  @IsOptional()
  @IsNormalizedEmail()
  email?: string;
}
