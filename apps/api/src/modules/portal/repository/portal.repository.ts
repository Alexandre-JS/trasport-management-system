import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

// Client-facing projection: shipment progress only, no internal driver documents.
const portalTripSelect = {
  id: true,
  currentStatus: true,
  currentPosition: true,
  borders: {
    select: {
      sequence: true,
      arrivedAt: true,
      clearedAt: true,
      border: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { sequence: 'asc' as const },
  },
  tonnage: true,
  loadedDate: true,
  departureDate: true,
  arrivalEstimate: true,
  arrivalDate: true,
  cargo: {
    select: {
      code: true,
      description: true,
      origin: true,
      destination: true,
    },
  },
  truck: { select: { plateNumber: true } },
  driver: { select: { fullName: true } },
  createdAt: true,
} satisfies Prisma.TripSelect;

const portalTripDetailSelect = {
  ...portalTripSelect,
  trackingToken: true,
  events: {
    select: {
      id: true,
      type: true,
      occurredAt: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
    },
    orderBy: { occurredAt: 'asc' as const },
  },
} satisfies Prisma.TripSelect;

@Injectable()
export class PortalRepository {
  constructor(private readonly prisma: PrismaService) {}

  getUserClientId(userId: string): Promise<{ clientId: string | null } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });
  }

  findClientTrips(clientId: string) {
    return this.prisma.trip.findMany({
      where: { deletedAt: null, cargo: { clientId } },
      select: portalTripSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findClientTrip(clientId: string, tripId: string) {
    return this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null, cargo: { clientId } },
      select: portalTripDetailSelect,
    });
  }
}
