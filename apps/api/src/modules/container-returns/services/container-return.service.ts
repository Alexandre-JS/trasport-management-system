import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { ConfirmContainerReturnDto } from '../dto/confirm-container-return.dto';
import { ContainerReturnRepository } from '../repository/container-return.repository';

@Injectable()
export class ContainerReturnService {
  constructor(private readonly repository: ContainerReturnRepository) {}

  async get(tripId: string) {
    const ctx = await this.repository.tripContext(tripId);
    if (!ctx) {
      throw new NotFoundException('Trip not found');
    }
    return ctx.containerReturn ?? null;
  }

  /** Abre a devolução: só para carga container e com a viagem descarregada. */
  async start(tripId: string, createdBy?: string) {
    const ctx = await this.repository.tripContext(tripId);
    if (!ctx) {
      throw new NotFoundException('Trip not found');
    }
    if (!this.repository.isContainerCargo(ctx.cargo.type)) {
      throw new BadRequestException(
        'Só cargas do tipo container têm devolução de container.',
      );
    }
    if (ctx.currentStatus !== TripStatus.DISCHARGED) {
      throw new BadRequestException(
        'A devolução só pode iniciar depois de a carga estar descarregada.',
      );
    }
    if (ctx.containerReturn) {
      throw new BadRequestException('A devolução já foi iniciada.');
    }
    return this.repository.start(tripId, createdBy);
  }

  /** Confirma a devolução (com POD): a viagem tem de estar em devolução. */
  async confirm(
    tripId: string,
    dto: ConfirmContainerReturnDto,
    createdBy?: string,
  ) {
    const ctx = await this.repository.tripContext(tripId);
    if (!ctx) {
      throw new NotFoundException('Trip not found');
    }
    if (ctx.currentStatus !== TripStatus.CONTAINER_RETURN_PENDING) {
      throw new BadRequestException(
        'Inicie a devolução antes de a confirmar.',
      );
    }
    return this.repository.confirm(tripId, dto, createdBy);
  }
}
