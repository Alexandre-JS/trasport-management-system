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
  dischargeDate: true,
  // Campos do quadro operacional visíveis ao cliente. Documentos do
  // motorista (passaporte, carta, telefone) ficam DE FORA de propósito.
  bookingReference: true,
  transporterName: true,
  horsePlate: true,
  trailerPlate: true,
  driverName: true,
  cargo: {
    select: {
      code: true,
      description: true,
      origin: true,
      destination: true,
    },
  },
  truck: { select: { plateNumber: true } },
  trailer: { select: { plateNumber: true } },
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
  // Última posição GPS reportada pelo motorista (mapa do portal).
  trackingPoints: {
    select: { latitude: true, longitude: true, recordedAt: true },
    orderBy: { recordedAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.TripSelect;

type RawPortalTripDetail = Prisma.TripGetPayload<{
  select: typeof portalTripDetailSelect;
}>;

function withLastLocation({ trackingPoints, ...trip }: RawPortalTripDetail) {
  const last = trackingPoints[0];
  return {
    ...trip,
    lastLocation: last
      ? {
          latitude: Number(last.latitude),
          longitude: Number(last.longitude),
          recordedAt: last.recordedAt,
        }
      : null,
  };
}

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

  async findClientTrip(clientId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null, cargo: { clientId } },
      select: portalTripDetailSelect,
    });

    return trip ? withLastLocation(trip) : null;
  }
}
