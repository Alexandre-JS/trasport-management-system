import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TripStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../core/auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../../core/database/prisma.service';
import { ConfirmDeliveryDto } from '../delivery/dto/confirm-delivery.dto';
import { ConfirmPickupDto } from '../delivery/dto/confirm-pickup.dto';
import { DeliveryService } from '../delivery/services/delivery.service';
import { CreateIncidentDto } from '../incidents/dto/create-incident.dto';
import { IncidentsService } from '../incidents/services/incidents.service';
import { CreateTrackingPointDto } from '../tracking/dto/create-tracking-point.dto';
import { TrackingService } from '../tracking/services/tracking.service';
import { RecordTripEventDto } from '../trips/dto/record-trip-event.dto';
import { TripsService } from '../trips/services/trips.service';

const driverTripSelect = {
  id: true,
  cargoId: true,
  truckId: true,
  trailerId: true,
  driverId: true,
  departureDate: true,
  arrivalEstimate: true,
  arrivalDate: true,
  loadedDate: true,
  currentStatus: true,
  currentPosition: true,
  border: true,
  tonnage: true,
  cargo: {
    select: {
      id: true,
      code: true,
      description: true,
      origin: true,
      destination: true,
      status: true,
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  },
  driver: {
    select: {
      id: true,
      fullName: true,
      licenseNumber: true,
      passportNumber: true,
    },
  },
  truck: {
    select: {
      id: true,
      plateNumber: true,
    },
  },
  trailer: {
    select: {
      id: true,
      plateNumber: true,
    },
  },
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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TripSelect;

const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.WAITING_APPOINTMENT,
  TripStatus.APPOINTMENT_DONE,
  TripStatus.LOADED,
  TripStatus.DISPATCHED_ORIGIN,
  TripStatus.AT_BORDER,
  TripStatus.BORDER_CLEARED,
  TripStatus.ARRIVED,
];

const NEXT_TRIP_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  [TripStatus.WAITING_APPOINTMENT]: TripStatus.APPOINTMENT_DONE,
  [TripStatus.APPOINTMENT_DONE]: TripStatus.LOADED,
  [TripStatus.LOADED]: TripStatus.DISPATCHED_ORIGIN,
  [TripStatus.DISPATCHED_ORIGIN]: TripStatus.AT_BORDER,
  [TripStatus.AT_BORDER]: TripStatus.BORDER_CLEARED,
  [TripStatus.BORDER_CLEARED]: TripStatus.ARRIVED,
};

@Injectable()
export class DriverMobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripsService: TripsService,
    private readonly deliveryService: DeliveryService,
    private readonly incidentsService: IncidentsService,
    private readonly trackingService: TrackingService,
  ) {}

  async getProfile(user: AuthenticatedUser) {
    const driver = await this.requireDriver(user.id);

    return {
      userId: user.id,
      driverId: driver.id,
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      phone: driver.phone,
      status: driver.status,
    };
  }

  async listTrips(user: AuthenticatedUser) {
    const driver = await this.requireDriver(user.id);
    const data = await this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        deletedAt: null,
      },
      select: driverTripSelect,
      orderBy: [{ departureDate: 'desc' }, { createdAt: 'desc' }],
      take: 25,
    });

    return { data };
  }

  async getCurrentTrip(user: AuthenticatedUser) {
    const driver = await this.requireDriver(user.id);
    const trip = await this.prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        deletedAt: null,
        currentStatus: { in: ACTIVE_STATUSES },
      },
      select: driverTripSelect,
      orderBy: [{ departureDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (!trip) {
      throw new NotFoundException('No active trip assigned to this driver');
    }

    return trip;
  }

  async getTrip(user: AuthenticatedUser, tripId: string) {
    await this.ensureDriverTrip(user.id, tripId);
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        deletedAt: null,
      },
      select: driverTripSelect,
    });

    if (!trip) {
      throw new NotFoundException('Trip not found for this driver');
    }

    return trip;
  }

  async recordTripEvent(
    user: AuthenticatedUser,
    tripId: string,
    dto: RecordTripEventDto,
  ) {
    await this.ensureDriverTrip(user.id, tripId);
    return this.tripsService.recordEvent(tripId, dto, user.id);
  }

  async advanceTrip(user: AuthenticatedUser, tripId: string) {
    await this.ensureDriverTrip(user.id, tripId);
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        deletedAt: null,
      },
      select: {
        currentStatus: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found for this driver');
    }

    const nextStatus = NEXT_TRIP_STATUS[trip.currentStatus];

    if (!nextStatus) {
      throw new BadRequestException('Trip cannot be advanced from this status');
    }

    return this.tripsService.updateStatus(tripId, {
      currentStatus: nextStatus,
    });
  }

  async confirmPickup(
    user: AuthenticatedUser,
    tripId: string,
    dto: ConfirmPickupDto,
  ) {
    await this.ensureDriverTrip(user.id, tripId);
    return this.deliveryService.confirmPickup(tripId, dto);
  }

  async confirmDelivery(
    user: AuthenticatedUser,
    tripId: string,
    dto: ConfirmDeliveryDto,
  ) {
    await this.ensureDriverTrip(user.id, tripId);
    return this.deliveryService.confirmDelivery(tripId, dto);
  }

  async reportIncident(
    user: AuthenticatedUser,
    tripId: string,
    dto: Omit<CreateIncidentDto, 'tripId'>,
  ) {
    await this.ensureDriverTrip(user.id, tripId);
    return this.incidentsService.create({ ...dto, tripId });
  }

  async recordTrackingPoint(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateTrackingPointDto,
  ) {
    await this.ensureDriverTrip(user.id, tripId);
    return this.trackingService.recordPoint(tripId, dto);
  }

  private async requireDriver(userId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        licenseNumber: true,
        phone: true,
        status: true,
      },
    });

    if (!driver) {
      throw new ForbiddenException(
        'Authenticated user is not linked to a driver',
      );
    }

    return driver;
  }

  private async ensureDriverTrip(userId: string, tripId: string) {
    const driver = await this.requireDriver(userId);
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId: driver.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found for this driver');
    }

    return trip;
  }
}
