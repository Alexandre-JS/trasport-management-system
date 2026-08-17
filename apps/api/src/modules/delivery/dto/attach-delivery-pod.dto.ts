import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AttachDeliveryPodDto {
  @ApiProperty({
    description: 'Delivery POD (image/PDF data URL or stored file URL)',
  })
  @IsString()
  @IsNotEmpty()
  podDocument!: string;
}
