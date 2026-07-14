import { Injectable } from '@nestjs/common';
import { CargoStatus, Prisma, TripStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { ConfirmPickupDto } from '../dto/confirm-pickup.dto';
import { ListDeliveriesQueryDto } from '../dto/list-deliveries-query.dto';
import { DeliveryEntity } from '../entities/delivery.entity';

const deliverySelect = {
  id: true,
  tripId: true,
  receiverName: true,
  receiverDocument: true,
  deliveryPhoto: true,
  podDocument: true,
  signature: true,
  deliveredAt: true,
  observations: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeliverySelect;

export type TripForDelivery = {
  id: string;
  cargoId: string;
  currentStatus: TripStatus;
  cargo: { id: string; status: CargoStatus };
};

@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'delivery', status: 'ready' };
  }

  findTripForDelivery(tripId: string): Promise<TripForDelivery | null> {
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

  async confirmPickup(
    tripId: string,
    cargoId: string,
    dto: ConfirmPickupDto,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cargo.update({
        where: { id: cargoId },
        data: {
          status: CargoStatus.PICKED_UP,
          pickupDate: new Date(),
          ...(dto.observations ? { observations: dto.observations } : {}),
        },
      }),
      this.prisma.trip.update({
        where: { id: tripId },
        data: {
          currentStatus: TripStatus.DISPATCHED_ORIGIN,
          departureDate: new Date(),
        },
      }),
    ]);
  }

  async confirmDelivery(
    tripId: string,
    cargoId: string,
    dto: ConfirmDeliveryDto,
  ): Promise<DeliveryEntity> {
    const [delivery] = await this.prisma.$transaction([
      this.prisma.delivery.create({
        data: {
          tripId,
          receiverName: dto.receiverName ?? null,
          receiverDocument: dto.receiverDocument ?? null,
          deliveryPhoto: dto.deliveryPhoto ?? null,
          podDocument: dto.podDocument ?? null,
          signature: dto.signature ?? null,
          observations: dto.observations ?? null,
          deliveredAt: new Date(),
        },
        select: deliverySelect,
      }),
      this.prisma.cargo.update({
        where: { id: cargoId },
        data: { status: CargoStatus.DELIVERED },
      }),
      this.prisma.trip.update({
        where: { id: tripId },
        data: {
          currentStatus: TripStatus.DISCHARGED,
          arrivalDate: new Date(),
        },
      }),
    ]);

    return delivery;
  }

  findById(id: string): Promise<DeliveryEntity | null> {
    return this.prisma.delivery.findUnique({
      where: { id },
      select: deliverySelect,
    });
  }

  async findMany(query: ListDeliveriesQueryDto): Promise<{
    data: DeliveryEntity[];
    total: number;
  }> {
    const where: Prisma.DeliveryWhereInput = {
      ...(query.tripId ? { tripId: query.tripId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where,
        select: deliverySelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return { data, total };
  }
}
