import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmContainerReturnDto {
  @ApiPropertyOptional({
    description: 'Dono/depósito a quem o container foi devolvido',
  })
  @IsOptional()
  @IsString()
  returnedTo?: string;

  @ApiPropertyOptional({ description: 'Nome de quem recebeu o container' })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiProperty({
    description: 'Documento POD que comprova a devolução (base64: foto/PDF)',
  })
  @IsString()
  @IsNotEmpty()
  podDocument!: string;

  @ApiPropertyOptional({ description: 'Observações da devolução' })
  @IsOptional()
  @IsString()
  observations?: string;
}
