import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

// Public projection: shipment progress only. No driver, truck, tonnage, or any
// commercial/personal data — safe to expose via an unauthenticated link.
const publicTrackSelect = {
  currentStatus: true,
  currentPosition: true,
  border: true,
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
