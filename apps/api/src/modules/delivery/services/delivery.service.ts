import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CargoStatus, NotificationType, TripStatus } from '@prisma/client';
import { RealtimeGateway } from '../../../core/events/realtime.gateway';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { NotificationDispatcherService } from '../../../core/notifications/notification-dispatcher.service';
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { ConfirmPickupDto } from '../dto/confirm-pickup.dto';
import { ListDeliveriesQueryDto } from '../dto/list-deliveries-query.dto';
import {
  DeliveryRepository,
  TripForDelivery,
} from '../repository/delivery.repository';

const OPERATIONS_ROLES = ['ADMIN', 'DISPATCHER'];
const TERMINAL_CARGO_STATUSES: CargoStatus[] = [
  CargoStatus.DELIVERED,
  CargoStatus.CANCELLED,
];

@Injectable()
export class DeliveryService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly notifications: NotificationDispatcherService,
    private readonly gateway: RealtimeGateway,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.deliveryRepository.health();
  }

  async confirmPickup(tripId: string, dto: ConfirmPickupDto) {
    const trip = await this.ensureTrip(tripId);

    if (trip.cargo.status === CargoStatus.PICKED_UP) {
      throw new BadRequestException('Cargo pickup already confirmed');
    }

    this.ensureCargoOperational(trip);

    await this.deliveryRepository.confirmPickup(tripId, trip.cargoId, dto);

    this.gateway.publish('cargo:statusChanged', {
      cargoId: trip.cargoId,
      tripId,
      status: CargoStatus.PICKED_UP,
    });

    await this.notifications.notifyRoles(OPERATIONS_ROLES, {
      title: 'Recolha efetuada',
      message: `A recolha da viagem ${tripId} foi confirmada.`,
      type: NotificationType.SUCCESS,
    });

    this.logger.log(
      `Pickup confirmed for trip ${tripId}`,
      DeliveryService.name,
    );

    return {
      tripId,
      cargoId: trip.cargoId,
      cargoStatus: CargoStatus.PICKED_UP,
      tripStatus: TripStatus.DISPATCHED_ORIGIN,
    };
  }

  async confirmDelivery(tripId: string, dto: ConfirmDeliveryDto) {
    const trip = await this.ensureTrip(tripId);

    this.ensureCargoOperational(trip);

    const delivery = await this.deliveryRepository.confirmDelivery(
      tripId,
      trip.cargoId,
      dto,
    );

    this.gateway.publish('cargo:statusChanged', {
      cargoId: trip.cargoId,
      tripId,
      status: CargoStatus.DELIVERED,
    });

    await this.notifications.notifyRoles(OPERATIONS_ROLES, {
      title: 'Entrega concluída',
      message: `A entrega da viagem ${tripId} foi confirmada.`,
      type: NotificationType.SUCCESS,
    });

    this.logger.log(
      `Delivery confirmed for trip ${tripId}: ${delivery.id}`,
      DeliveryService.name,
    );

    return delivery;
  }

  async findAll(query: ListDeliveriesQueryDto) {
    const { data, total } = await this.deliveryRepository.findMany(query);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const delivery = await this.deliveryRepository.findById(id);

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  private async ensureTrip(tripId: string): Promise<TripForDelivery> {
    const trip = await this.deliveryRepository.findTripForDelivery(tripId);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.currentStatus === TripStatus.CANCELLED) {
      throw new BadRequestException('Trip is cancelled');
    }

    return trip;
  }

  private ensureCargoOperational(trip: TripForDelivery) {
    if (TERMINAL_CARGO_STATUSES.includes(trip.cargo.status)) {
      throw new BadRequestException(
        `Cargo is already ${trip.cargo.status.toLowerCase()}`,
      );
    }
  }
}
