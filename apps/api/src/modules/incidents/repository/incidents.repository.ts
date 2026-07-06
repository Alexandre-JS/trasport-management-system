import { Injectable } from '@nestjs/common';
import { CargoStatus, Prisma, TripStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { ListIncidentsQueryDto } from '../dto/list-incidents-query.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { IncidentEntity } from '../entities/incident.entity';

const incidentSelect = {
  id: true,
  tripId: true,
  type: true,
  description: true,
  latitude: true,
  longitude: true,
  photo: true,
  reportedAt: true,
  resolvedAt: true,
  trip: {
    select: {
      id: true,
      cargo: { select: { code: true } },
      driver: { select: { fullName: true } },
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IncidentSelect;

export type TripForIncident = {
  id: string;
  cargoId: string;
  currentStatus: TripStatus;
  cargo: { id: string; status: CargoStatus };
};

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'incidents', status: 'ready' };
  }

  findTripForIncident(tripId: string): Promise<TripForIncident | null> {
    return this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      select: {
        id: true,
        cargoId: true,
        currentStatus: true,
        cargo: { select: { id: true, status: true } },
      },
    });
  }

  create(data: CreateIncidentDto): Promise<IncidentEntity> {
    return this.prisma.incident.create({
      data: {
        tripId: data.tripId,
        type: data.type,
        description: data.description ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        photo: data.photo ?? null,
      },
      select: incidentSelect,
    });
  }

  markCargoIncident(cargoId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.cargo.updateMany({
      where: {
        id: cargoId,
        status: {
          notIn: [
            CargoStatus.DELIVERED,
            CargoStatus.CANCELLED,
            CargoStatus.INCIDENT,
          ],
        },
      },
      data: { status: CargoStatus.INCIDENT },
    });
  }

  findById(id: string): Promise<IncidentEntity | null> {
    return this.prisma.incident.findUnique({
      where: { id },
      select: incidentSelect,
    });
  }

  async findMany(query: ListIncidentsQueryDto): Promise<{
    data: IncidentEntity[];
    total: number;
  }> {
    const where: Prisma.IncidentWhereInput = {
      ...(query.tripId ? { tripId: query.tripId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.resolved === undefined
        ? {}
        : query.resolved
          ? { resolvedAt: { not: null } }
          : { resolvedAt: null }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.incident.findMany({
        where,
        select: incidentSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return { data, total };
  }

  update(id: string, data: UpdateIncidentDto): Promise<IncidentEntity> {
    return this.prisma.incident.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.photo !== undefined ? { photo: data.photo } : {}),
      },
      select: incidentSelect,
    });
  }

  resolve(id: string): Promise<IncidentEntity> {
    return this.prisma.incident.update({
      where: { id },
      data: { resolvedAt: new Date() },
      select: incidentSelect,
    });
  }

  remove(id: string): Promise<IncidentEntity> {
    return this.prisma.incident.delete({
      where: { id },
      select: incidentSelect,
    });
  }
}
