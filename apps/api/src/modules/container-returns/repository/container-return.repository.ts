import { Injectable } from '@nestjs/common';
import { CargoType, TripEventType, TripStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { ConfirmContainerReturnDto } from '../dto/confirm-container-return.dto';

const returnSelect = {
  id: true,
  tripId: true,
  returnedTo: true,
  receiverName: true,
  podDocument: true,
  returnedAt: true,
  observations: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ContainerReturnRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Trip com o essencial para validar o fluxo de devolução do container. */
  tripContext(tripId: string) {
    return this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      select: {
        id: true,
        currentStatus: true,
        cargo: { select: { type: true, containerNumber: true } },
        containerReturn: { select: returnSelect },
      },
    });
  }

  findByTrip(tripId: string) {
    return this.prisma.containerReturn.findUnique({
      where: { tripId },
      select: returnSelect,
    });
  }

  /**
   * Abre o processo: cria o registo de devolução (vazio) e move a viagem
   * para CONTAINER_RETURN_PENDING, com evento de auditoria. Tudo atómico.
   */
  async start(tripId: string, createdBy?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { currentStatus: TripStatus.CONTAINER_RETURN_PENDING },
      });
      await tx.tripEvent.create({
        data: {
          tripId,
          type: TripEventType.STATUS_CHANGE,
          occurredAt: new Date(),
          fromStatus: TripStatus.DISCHARGED,
          toStatus: TripStatus.CONTAINER_RETURN_PENDING,
          note: 'Início da devolução do container',
          createdBy: createdBy ?? null,
        },
      });
      return tx.containerReturn.create({
        data: { tripId },
        select: returnSelect,
      });
    });
  }

  /**
   * Fecha o processo: grava o POD e os dados da devolução e move a viagem
   * para CONTAINER_RETURNED (terminal), com evento de auditoria.
   */
  async confirm(
    tripId: string,
    dto: ConfirmContainerReturnDto,
    createdBy?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { currentStatus: TripStatus.CONTAINER_RETURNED },
      });
      await tx.tripEvent.create({
        data: {
          tripId,
          type: TripEventType.STATUS_CHANGE,
          occurredAt: new Date(),
          fromStatus: TripStatus.CONTAINER_RETURN_PENDING,
          toStatus: TripStatus.CONTAINER_RETURNED,
          note: 'Container devolvido (POD registado)',
          createdBy: createdBy ?? null,
        },
      });
      return tx.containerReturn.update({
        where: { tripId },
        data: {
          returnedTo: dto.returnedTo ?? null,
          receiverName: dto.receiverName ?? null,
          podDocument: dto.podDocument ?? null,
          observations: dto.observations ?? null,
          returnedAt: new Date(),
        },
        select: returnSelect,
      });
    });
  }

  isContainerCargo(type: string): boolean {
    return type === CargoType.CONTAINER;
  }
}
