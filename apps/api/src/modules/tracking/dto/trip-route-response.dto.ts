import { ApiProperty } from '@nestjs/swagger';

class RoutePointDto {
  @ApiProperty({ example: -25.9655 })
  latitude!: number;

  @ApiProperty({ example: 32.5832 })
  longitude!: number;

  @ApiProperty({ required: false, nullable: true, example: 62.5 })
  speed!: number | null;

  @ApiProperty({ required: false, nullable: true, example: 180 })
  heading!: number | null;

  @ApiProperty()
  recordedAt!: Date;
}

export class TripRouteResponseDto {
  @ApiProperty()
  tripId!: string;

  @ApiProperty({ example: 42, description: 'Número de posições do percurso' })
  count!: number;

  @ApiProperty({
    type: RoutePointDto,
    isArray: true,
    description:
      'Posições ordenadas cronologicamente, prontas para desenhar no mapa',
  })
  points!: RoutePointDto[];
}
