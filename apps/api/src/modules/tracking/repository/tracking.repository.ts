import { Injectable } from '@nestjs/common';
import { Prisma, TripStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateTrackingPointDto } from '../dto/create-tracking-point.dto';
import { ListTrackingQueryDto } from '../dto/list-tracking-query.dto';
import { TrackingPointEntity } from '../entities/tracking-point.entity';

const trackingSelect = {
  id: true,
  tripId: true,
  latitude: true,
  longitude: true,
  speed: true,
  heading: true,
  accuracy: true,
  recordedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrackingPointSelect;

const routeSelect = {
  latitude: true,
  longitude: true,
  speed: true,
  heading: true,
  recordedAt: true,
} satisfies Prisma.TrackingPointSelect;

type RoutePoint = Prisma.TrackingPointGetPayload<{
  select: typeof routeSelect;
}>;

@Injectable()
export class TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'tracking', status: 'ready' };
  }

  tripExists(tripId: string): Promise<boolean> {
    return this.prisma.trip
      .count({
        where: {
          id: tripId,
          deletedAt: null,
          currentStatus: {
            not: TripStatus.CANCELLED,
          },
        },
      })
      .then((count) => count > 0);
  }

  create(
    tripId: string,
    data: CreateTrackingPointDto,
  ): Promise<TrackingPointEntity> {
    return this.prisma.trackingPoint.create({
      data: {
        tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed ?? null,
        heading: data.heading ?? null,
        accuracy: data.accuracy ?? null,
        ...(data.recordedAt ? { recordedAt: new Date(data.recordedAt) } : {}),
      },
      select: trackingSelect,
    });
  }

  findLast(tripId: string): Promise<TrackingPointEntity | null> {
    return this.prisma.trackingPoint.findFirst({
      where: { tripId },
      select: trackingSelect,
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Atualiza "Posição atual" (texto) só quando muda — evita escritas repetidas.
   * O ramo `null` é necessário porque em SQL `coluna <> 'x'` é desconhecido
   * (não-verdadeiro) quando a coluna é NULL, e a linha ficaria de fora.
   */
  async updateTripPositionIfChanged(
    tripId: string,
    position: string,
  ): Promise<void> {
    await this.prisma.trip.updateMany({
      where: {
        id: tripId,
        OR: [{ currentPosition: null }, { currentPosition: { not: position } }],
      },
      data: { currentPosition: position },
    });
  }

  async findMany(
    tripId: string,
    query: ListTrackingQueryDto,
  ): Promise<{ data: TrackingPointEntity[]; total: number }> {
    const where = this.buildWhere(tripId, query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.trackingPoint.findMany({
        where,
        select: trackingSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { recordedAt: query.sortOrder },
      }),
      this.prisma.trackingPoint.count({ where }),
    ]);

    return { data, total };
  }

  findRoute(tripId: string): Promise<RoutePoint[]> {
    return this.prisma.trackingPoint.findMany({
      where: { tripId },
      select: routeSelect,
      orderBy: { recordedAt: 'asc' },
    });
  }

  private buildWhere(
    tripId: string,
    query: ListTrackingQueryDto,
  ): Prisma.TrackingPointWhereInput {
    return {
      tripId,
      ...(query.from || query.to
        ? {
            recordedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
  }
}
