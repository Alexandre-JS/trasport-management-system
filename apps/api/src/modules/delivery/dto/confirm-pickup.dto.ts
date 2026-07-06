import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmPickupDto {
  @ApiPropertyOptional({ description: 'Observações registadas na recolha' })
  @IsOptional()
  @IsString()
  observations?: string;
}
