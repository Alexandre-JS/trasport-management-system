import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

// Public projection: shipment progress only. No driver, truck, tonnage, or any
// commercial/personal data — safe to expose via an unauthenticated link.
const publicTrackSelect = {
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
  arrivalEstimate: true,
  cargo: {
    select: {
      code: true,
      origin: true,
      destination: true,
    },
  },
  events: {
    select: {
      id: true,
      type: true,
      occurredAt: true,
      toStatus: true,
      note: true,
    },
    orderBy: { occurredAt: 'asc' as const },
  },
} satisfies Prisma.TripSelect;

@Injectable()
export class PublicTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByToken(token: string) {
    return this.prisma.trip.findFirst({
      where: { trackingToken: token, deletedAt: null },
      select: publicTrackSelect,
    });
  }
}
