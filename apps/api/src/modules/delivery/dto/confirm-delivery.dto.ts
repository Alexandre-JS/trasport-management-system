import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmDeliveryDto {
  @ApiPropertyOptional({ description: 'Nome de quem recebeu a carga' })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional({ description: 'Documento de quem recebeu a carga' })
  @IsOptional()
  @IsString()
  receiverDocument?: string;

  @ApiPropertyOptional({
    description: 'Fotografia da entrega (URL ou conteúdo em base64)',
  })
  @IsOptional()
  @IsString()
  deliveryPhoto?: string;

  @ApiPropertyOptional({
    description: 'Assinatura do recetor (URL ou conteúdo em base64)',
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    description: 'Documento POD que comprova a entrega (base64: foto/PDF)',
  })
  @IsOptional()
  @IsString()
  podDocument?: string;

  @ApiPropertyOptional({ description: 'Observações registadas na entrega' })
  @IsOptional()
  @IsString()
  observations?: string;
}
