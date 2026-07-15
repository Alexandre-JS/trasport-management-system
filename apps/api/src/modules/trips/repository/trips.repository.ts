import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CargoStatus,
  DriverStatus,
  Prisma,
  TrailerStatus,
  TripStatus,
  TruckStatus,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { TripStateMachine } from '../domain/trip-state-machine';
import { CreateTripDto } from '../dto/create-trip.dto';
import { ListTripsQueryDto } from '../dto/list-trips-query.dto';
import { RecordTripEventDto } from '../dto/record-trip-event.dto';
import { UpdateTripDto } from '../dto/update-trip.dto';
import { TripDetailEntity, TripEntity } from '../entities/trip.entity';

const tripSelect = {
  id: true,
  cargoId: true,
  truckId: true,
  trailerId: true,
  driverId: true,
  departureDate: true,
  arrivalEstimate: true,
  arrivalDate: true,
  loadedDate: true,
  dischargeDate: true,
  currentStatus: true,
  currentPosition: true,
  tonnage: true,
  transporterName: true,
  isSubcontracted: true,
  dispatchedBy: true,
  remarks: true,
  horsePlate: true,
  trailerPlate: true,
  driverName: true,
  driverPassport: true,
  driverLicense: true,
  driverPhone: true,
  bookingReference: true,
  borders: {
    select: {
      id: true,
      sequence: true,
      arrivedAt: true,
      clearedAt: true,
      border: {
        select: {
          id: true,
          name: true,
          countryA: true,
          countryB: true,
          lat: true,
          lng: true,
        },
      },
    },
    orderBy: { sequence: 'asc' as const },
  },
  cargo: {
    select: {
      id: true,
      clientId: true,
      code: true,
      origin: true,
      destination: true,
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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TripSelect;

const tripEventSelect = {
  id: true,
  type: true,
  occurredAt: true,
  fromStatus: true,
  toStatus: true,
  note: true,
  createdBy: true,
  createdAt: true,
} satisfies Prisma.TripEventSelect;

// Detail view also carries the tracking token (for sharing) and the auditable
// event history (chronological).
const tripDetailSelect = {
  ...tripSelect,
  trackingToken: true,
  events: {
    select: tripEventSelect,
    orderBy: { occurredAt: 'asc' as const },
  },
} satisfies Prisma.TripSelect;

@Injectable()
export class TripsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: TripStateMachine,
  ) {}

  health() {
    return { module: 'trips', status: 'ready' };
  }

  async findMany(query: ListTripsQueryDto): Promise<{
    data: TripEntity[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        select: tripSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<TripDetailEntity | null> {
    return this.prisma.trip.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: tripDetailSelect,
    });
  }

  cargoExists(cargoId: string): Promise<boolean> {
    return this.prisma.cargo
      .count({
        where: {
          id: cargoId,
          deletedAt: null,
          status: {
            notIn: [CargoStatus.CANCELLED, CargoStatus.DELIVERED],
          },
        },
      })
      .then((count) => count > 0);
  }

  driverExists(driverId: string): Promise<boolean> {
    return this.prisma.driver
      .count({
        where: {
          id: driverId,
          deletedAt: null,
          status: {
            not: DriverStatus.INACTIVE,
          },
        },
      })
      .then((count) => count > 0);
  }

  truckExists(truckId: string): Promise<boolean> {
    return this.prisma.truck
      .count({
        where: {
          id: truckId,
          deletedAt: null,
          status: {
            not: TruckStatus.INACTIVE,
          },
        },
      })
      .then((count) => count > 0);
  }

  trailerExists(trailerId: string): Promise<boolean> {
    return this.prisma.trailer
      .count({
        where: {
          id: trailerId,
          deletedAt: null,
          status: {
            not: TrailerStatus.INACTIVE,
          },
        },
      })
      .then((count) => count > 0);
  }

  create(data: CreateTripDto): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      // Recursos próprios são opcionais (viagem subcontratada usa só snapshots).
      // Cada um só é validado/ocupado/anti-duplicado quando o seu id vem no DTO.
      if (data.driverId) {
        const driver = await tx.driver.findFirst({
          where: { id: data.driverId, deletedAt: null },
          select: { id: true, status: true },
        });
        if (!driver) {
          throw new NotFoundException('Driver not found');
        }
        if (driver.status !== DriverStatus.AVAILABLE) {
          throw new ConflictException(
            `Driver is not available (status: ${driver.status})`,
          );
        }
      }

      if (data.truckId) {
        const truck = await tx.truck.findFirst({
          where: { id: data.truckId, deletedAt: null },
          select: { id: true, status: true },
        });
        if (!truck) {
          throw new NotFoundException('Truck not found');
        }
        if (truck.status !== TruckStatus.AVAILABLE) {
          throw new ConflictException(
            `Truck is not available (status: ${truck.status})`,
          );
        }
      }

      if (data.trailerId) {
        const trailer = await tx.trailer.findFirst({
          where: { id: data.trailerId, deletedAt: null },
          select: { id: true, status: true, truckId: true },
        });
        if (!trailer) {
          throw new NotFoundException('Trailer not found');
        }
        if (trailer.status !== TrailerStatus.AVAILABLE) {
          throw new ConflictException(
            `Trailer is not available (status: ${trailer.status})`,
          );
        }
        if (
          data.truckId &&
          trailer.truckId &&
          trailer.truckId !== data.truckId
        ) {
          throw new ConflictException(
            'Trailer is assigned to a different truck',
          );
        }
      }

      await this.assertNoActiveTrip(tx, { cargoId: data.cargoId }, '', 'Cargo');
      if (data.driverId) {
        await this.assertNoActiveTrip(
          tx,
          { driverId: data.driverId },
          '',
          'Driver',
        );
      }
      if (data.truckId) {
        await this.assertNoActiveTrip(
          tx,
          { truckId: data.truckId },
          '',
          'Truck',
        );
      }
      if (data.trailerId) {
        await this.assertNoActiveTrip(
          tx,
          { trailerId: data.trailerId },
          '',
          'Trailer',
        );
      }

      const created = await tx.trip.create({
        data: this.toTripData(data),
        select: { id: true },
      });

      if (data.borderIds?.length) {
        await this.assertBordersUsable(tx, data.borderIds);
        await tx.tripBorder.createMany({
          data: data.borderIds.map((borderId, index) => ({
            tripId: created.id,
            borderId,
            sequence: index + 1,
          })),
        });
      }

      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: created.id },
        select: tripSelect,
      });

      if (
        this.stateMachine.occupiesResources(
          data.currentStatus ?? TripStatus.WAITING_APPOINTMENT,
        )
      ) {
        await tx.cargo.updateMany({
          where: { id: data.cargoId, status: CargoStatus.CREATED },
          data: { status: CargoStatus.WAITING_PICKUP },
        });
        if (data.driverId) {
          await tx.driver.update({
            where: { id: data.driverId },
            data: { status: DriverStatus.ON_TRIP },
          });
        }
        if (data.truckId) {
          await tx.truck.update({
            where: { id: data.truckId },
            data: { status: TruckStatus.ON_TRIP },
          });
        }
        if (data.trailerId) {
          await tx.trailer.update({
            where: { id: data.trailerId },
            data: { status: TrailerStatus.ON_TRIP },
          });
        }
      }

      return trip;
    });
  }

  update(id: string, data: UpdateTripDto): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      // borderIds replaces the whole route — but never after the driver has
      // reached a border, or the stamped history would be rewritten.
      if (data.borderIds !== undefined) {
        const started = await tx.tripBorder.count({
          where: { tripId: id, arrivedAt: { not: null } },
        });
        if (started > 0) {
          throw new ConflictException(
            'Cannot change borders after a border crossing has started',
          );
        }
        if (data.borderIds.length > 0) {
          await this.assertBordersUsable(tx, data.borderIds);
        }
        await tx.tripBorder.deleteMany({ where: { tripId: id } });
        if (data.borderIds.length > 0) {
          await tx.tripBorder.createMany({
            data: data.borderIds.map((borderId, index) => ({
              tripId: id,
              borderId,
              sequence: index + 1,
            })),
          });
        }
      }

      return tx.trip.update({
        where: { id },
        data: this.toTripData(data),
        select: tripSelect,
      });
    });
  }

  /** Every referenced border must exist, be active and not deleted. */
  private async assertBordersUsable(
    tx: Prisma.TransactionClient,
    borderIds: string[],
  ): Promise<void> {
    const found = await tx.border.count({
      where: {
        id: { in: borderIds },
        deletedAt: null,
        isActive: true,
      },
    });
    if (found !== borderIds.length) {
      throw new NotFoundException('One or more borders not found or inactive');
    }
  }

  async updateStatus(id: string, toStatus: TripStatus): Promise<TripEntity> {
    return this.prisma.$transaction((tx) =>
      this.applyTransition(tx, id, toStatus),
    );
  }

  async recordMilestone(
    id: string,
    dto: RecordTripEventDto,
    createdBy?: string,
  ): Promise<TripEntity> {
    const toStatus = this.stateMachine.statusForEvent(dto.type);
    return this.prisma.$transaction((tx) =>
      this.applyTransition(tx, id, toStatus, {
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        note: dto.note,
        createdBy,
      }),
    );
  }

  /**
   * Atomically move a trip to `toStatus`: validate the transition against the
   * state machine, persist it (preserving the arrivalDate side-effect on
   * DISCHARGED), release resources on terminal states, and record a milestone
   * TripEvent — all on the same `tx`, never `this.prisma`.
   */
  private async applyTransition(
    tx: Prisma.TransactionClient,
    id: string,
    toStatus: TripStatus,
    meta: { occurredAt?: Date; note?: string; createdBy?: string } = {},
  ): Promise<TripEntity> {
    const trip = await tx.trip.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        cargoId: true,
        currentStatus: true,
        driverId: true,
        truckId: true,
        trailerId: true,
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const fromStatus = trip.currentStatus;
    this.stateMachine.assertTransition(fromStatus, toStatus);

    const now = new Date();
    const occurredAt = meta.occurredAt ?? now;

    // Border context: the state machine allows the border cycle statically;
    // whether this trip actually has a pending border is checked here, and the
    // crossing being entered/cleared is stamped so the route history is kept.
    const borderName = await this.applyBorderTransition(
      tx,
      id,
      toStatus,
      occurredAt,
    );

    const updated = await tx.trip.update({
      where: { id },
      data: {
        currentStatus: toStatus,
        ...(toStatus === TripStatus.DISCHARGED ? { arrivalDate: now } : {}),
      },
      select: tripSelect,
    });

    await tx.cargo.update({
      where: { id: trip.cargoId },
      data: { status: this.cargoStatusForTripStatus(toStatus) },
    });

    // Symmetric resource release: on a terminal state free driver & truck.
    if (this.stateMachine.isTerminal(toStatus)) {
      await this.releaseResources(
        tx,
        trip.driverId,
        trip.truckId,
        trip.trailerId,
      );
    }

    // Every transition is auditable: a specific milestone type for the 5 marcos,
    // otherwise the generic STATUS_CHANGE. assertTransition above guarantees a
    // real transition here, so we always record exactly one event.
    await this.recordStateEvent(tx, {
      tripId: id,
      fromStatus,
      toStatus,
      occurredAt,
      note: meta.note ?? borderName,
      createdBy: meta.createdBy,
    });

    return updated;
  }

  /**
   * Contextual border guards for a status transition, stamping the crossing
   * involved. Returns the border name (to enrich the audit event) or undefined
   * when the transition has no border meaning.
   */
  private async applyBorderTransition(
    tx: Prisma.TransactionClient,
    tripId: string,
    toStatus: TripStatus,
    occurredAt: Date,
  ): Promise<string | undefined> {
    if (toStatus === TripStatus.AT_BORDER) {
      const next = await tx.tripBorder.findFirst({
        where: { tripId, clearedAt: null },
        orderBy: { sequence: 'asc' },
        select: { id: true, border: { select: { name: true } } },
      });
      if (!next) {
        throw new ConflictException(
          'Trip has no pending border crossing — assign borders to the trip first',
        );
      }
      await tx.tripBorder.update({
        where: { id: next.id },
        data: { arrivedAt: occurredAt },
      });
      return next.border.name;
    }

    if (toStatus === TripStatus.BORDER_CLEARED) {
      const current = await tx.tripBorder.findFirst({
        where: { tripId, arrivedAt: { not: null }, clearedAt: null },
        orderBy: { sequence: 'asc' },
        select: { id: true, border: { select: { name: true } } },
      });
      if (!current) {
        throw new ConflictException('Trip is not at a border');
      }
      await tx.tripBorder.update({
        where: { id: current.id },
        data: { clearedAt: occurredAt },
      });
      return current.border.name;
    }

    if (toStatus === TripStatus.ARRIVED) {
      const pending = await tx.tripBorder.count({
        where: { tripId, clearedAt: null },
      });
      if (pending > 0) {
        throw new ConflictException(
          'Trip still has border crossings to clear before arriving',
        );
      }
    }

    return undefined;
  }

  async assignDriver(id: string, driverId: string): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssignableTrip(tx, id);

      const driver = await tx.driver.findFirst({
        where: { id: driverId, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new ConflictException(
          `Driver is not available (status: ${driver.status})`,
        );
      }

      await this.assertNoActiveTrip(tx, { driverId }, id, 'Driver');

      await tx.driver.update({
        where: { id: driverId },
        data: { status: DriverStatus.ON_TRIP },
      });

      return tx.trip.update({
        where: { id },
        data: { driverId },
        select: tripSelect,
      });
    });
  }

  async assignTruck(id: string, truckId: string): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssignableTrip(tx, id);

      const truck = await tx.truck.findFirst({
        where: { id: truckId, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!truck) {
        throw new NotFoundException('Truck not found');
      }
      if (truck.status !== TruckStatus.AVAILABLE) {
        throw new ConflictException(
          `Truck is not available (status: ${truck.status})`,
        );
      }

      await this.assertNoActiveTrip(tx, { truckId }, id, 'Truck');

      await tx.truck.update({
        where: { id: truckId },
        data: { status: TruckStatus.ON_TRIP },
      });

      return tx.trip.update({
        where: { id },
        data: { truckId },
        select: tripSelect,
      });
    });
  }

  async assignTrailer(id: string, trailerId: string): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssignableTrip(tx, id);

      const trailer = await tx.trailer.findFirst({
        where: { id: trailerId, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!trailer) {
        throw new NotFoundException('Trailer not found');
      }
      if (trailer.status !== TrailerStatus.AVAILABLE) {
        throw new ConflictException(
          `Trailer is not available (status: ${trailer.status})`,
        );
      }

      await this.assertNoActiveTrip(tx, { trailerId }, id, 'Trailer');

      await tx.trailer.update({
        where: { id: trailerId },
        data: { status: TrailerStatus.ON_TRIP },
      });

      return tx.trip.update({
        where: { id },
        data: { trailerId },
        select: tripSelect,
      });
    });
  }

  async assignCargo(id: string, cargoId: string): Promise<TripEntity> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssignableTrip(tx, id);

      const cargo = await tx.cargo.findFirst({
        where: { id: cargoId, deletedAt: null },
        select: { id: true },
      });
      if (!cargo) {
        throw new NotFoundException('Cargo not found');
      }

      // Cargo has no ON_TRIP status (owned by delivery); anti-double-booking only.
      await this.assertNoActiveTrip(tx, { cargoId }, id, 'Cargo');

      return tx.trip.update({
        where: { id },
        data: { cargoId },
        select: tripSelect,
      });
    });
  }

  /** A trip must exist and not be terminal to receive resource assignments. */
  private async ensureAssignableTrip(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<void> {
    const trip = await tx.trip.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, currentStatus: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (this.stateMachine.isTerminal(trip.currentStatus)) {
      throw new ConflictException(
        `Cannot assign resources to a ${trip.currentStatus.toLowerCase()} trip`,
      );
    }
  }

  /**
   * Anti-double-booking: reject when the resource is already attached to another
   * non-deleted trip whose status still occupies resources. The occupying set is
   * derived from the state machine (occupyingStatuses), never hardcoded here.
   */
  private async assertNoActiveTrip(
    tx: Prisma.TransactionClient,
    resource: {
      driverId?: string;
      truckId?: string;
      trailerId?: string;
      cargoId?: string;
    },
    currentTripId: string,
    label: string,
  ): Promise<void> {
    const conflicts = await tx.trip.count({
      where: {
        ...resource,
        id: { not: currentTripId },
        deletedAt: null,
        currentStatus: { in: this.stateMachine.occupyingStatuses() },
      },
    });
    if (conflicts > 0) {
      throw new ConflictException(
        `${label} is already assigned to an active trip`,
      );
    }
  }

  /**
   * Free a trip's driver, truck & trailer back to AVAILABLE. Guarding by
   * status = ON_TRIP makes it a safe no-op when nothing is held. Cargo is owned
   * by the delivery module and is intentionally left untouched.
   */
  private async releaseResources(
    tx: Prisma.TransactionClient,
    driverId: string | null,
    truckId: string | null,
    trailerId: string | null,
  ): Promise<void> {
    // Recursos externos (subcontratados) não têm registo próprio — nada a
    // libertar. Só se liberta o que é da empresa (id presente).
    if (driverId) {
      await tx.driver.updateMany({
        where: { id: driverId, status: DriverStatus.ON_TRIP },
        data: { status: DriverStatus.AVAILABLE },
      });
    }
    if (truckId) {
      await tx.truck.updateMany({
        where: { id: truckId, status: TruckStatus.ON_TRIP },
        data: { status: TruckStatus.AVAILABLE },
      });
    }
    if (trailerId) {
      await tx.trailer.updateMany({
        where: { id: trailerId, status: TrailerStatus.ON_TRIP },
        data: { status: TrailerStatus.AVAILABLE },
      });
    }
  }

  private cargoStatusForTripStatus(status: TripStatus): CargoStatus {
    switch (status) {
      case TripStatus.WAITING_APPOINTMENT:
      case TripStatus.APPOINTMENT_DONE:
        return CargoStatus.WAITING_PICKUP;
      case TripStatus.LOADED:
        return CargoStatus.PICKED_UP;
      case TripStatus.DISPATCHED_ORIGIN:
      case TripStatus.AT_BORDER:
      case TripStatus.BORDER_CLEARED:
        return CargoStatus.IN_TRANSIT;
      case TripStatus.ARRIVED:
        return CargoStatus.NEAR_DESTINATION;
      case TripStatus.DISCHARGED:
      // A carga já foi entregue; a devolução do container vazio não altera o
      // estado da carga, que permanece DELIVERED.
      case TripStatus.CONTAINER_RETURN_PENDING:
      case TripStatus.CONTAINER_RETURNED:
        return CargoStatus.DELIVERED;
      case TripStatus.CANCELLED:
        return CargoStatus.CANCELLED;
    }
  }

  /**
   * Append one auditable TripEvent for a state transition, on the same `tx`.
   * The event type is resolved by the state machine (specific milestone or the
   * generic STATUS_CHANGE); the detail lives in fromStatus/toStatus.
   */
  private async recordStateEvent(
    tx: Prisma.TransactionClient,
    params: {
      tripId: string;
      fromStatus: TripStatus;
      toStatus: TripStatus;
      occurredAt: Date;
      note?: string;
      createdBy?: string;
    },
  ): Promise<void> {
    await tx.tripEvent.create({
      data: {
        tripId: params.tripId,
        type: this.stateMachine.eventForStatus(params.toStatus),
        occurredAt: params.occurredAt,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        note: params.note ?? null,
        createdBy: params.createdBy ?? null,
      },
    });
  }

  async softDelete(id: string, createdBy?: string): Promise<TripEntity> {
    // Deleting a trip is, operationally, a cancellation: stamp CANCELLED +
    // deletedAt (preserving prior behaviour), release the held resources with the
    // same guarded no-op used by state transitions, and audit it — all atomically.
    // We do not assertTransition here: an already terminal trip must delete
    // without error, and the release is a safe no-op in that case.
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          currentStatus: true,
          driverId: true,
          truckId: true,
          trailerId: true,
        },
      });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const updated = await tx.trip.update({
        where: { id },
        data: {
          currentStatus: TripStatus.CANCELLED,
          deletedAt: new Date(),
        },
        select: tripSelect,
      });

      await this.releaseResources(
        tx,
        trip.driverId,
        trip.truckId,
        trip.trailerId,
      );

      // Audit the cancellation — unless the trip was already CANCELLED, which is
      // not a real transition and would only add noise.
      if (trip.currentStatus !== TripStatus.CANCELLED) {
        await this.recordStateEvent(tx, {
          tripId: id,
          fromStatus: trip.currentStatus,
          toStatus: TripStatus.CANCELLED,
          occurredAt: new Date(),
          createdBy,
        });
      }

      return updated;
    });
  }

  private toTripData(
    data: CreateTripDto | UpdateTripDto,
  ): Prisma.TripUpdateInput & Prisma.TripCreateInput {
    return {
      ...(data.cargoId ? { cargo: { connect: { id: data.cargoId } } } : {}),
      ...(data.truckId ? { truck: { connect: { id: data.truckId } } } : {}),
      ...(data.trailerId
        ? { trailer: { connect: { id: data.trailerId } } }
        : {}),
      ...(data.driverId ? { driver: { connect: { id: data.driverId } } } : {}),
      ...(data.departureDate
        ? { departureDate: new Date(data.departureDate) }
        : {}),
      ...(data.arrivalEstimate
        ? { arrivalEstimate: new Date(data.arrivalEstimate) }
        : {}),
      ...(data.arrivalDate ? { arrivalDate: new Date(data.arrivalDate) } : {}),
      ...(data.loadedDate ? { loadedDate: new Date(data.loadedDate) } : {}),
      ...(data.dischargeDate
        ? { dischargeDate: new Date(data.dischargeDate) }
        : {}),
      ...(data.currentPosition !== undefined
        ? { currentPosition: data.currentPosition || null }
        : {}),
      ...(data.tonnage !== undefined ? { tonnage: data.tonnage } : {}),
      ...(data.transporterName !== undefined
        ? { transporterName: data.transporterName || null }
        : {}),
      ...(data.isSubcontracted !== undefined
        ? { isSubcontracted: data.isSubcontracted }
        : {}),
      ...(data.dispatchedBy !== undefined
        ? { dispatchedBy: data.dispatchedBy || null }
        : {}),
      ...(data.remarks !== undefined ? { remarks: data.remarks || null } : {}),
      ...(data.horsePlate !== undefined
        ? { horsePlate: data.horsePlate || null }
        : {}),
      ...(data.trailerPlate !== undefined
        ? { trailerPlate: data.trailerPlate || null }
        : {}),
      ...(data.driverName !== undefined
        ? { driverName: data.driverName || null }
        : {}),
      ...(data.driverPassport !== undefined
        ? { driverPassport: data.driverPassport || null }
        : {}),
      ...(data.driverLicense !== undefined
        ? { driverLicense: data.driverLicense || null }
        : {}),
      ...(data.driverPhone !== undefined
        ? { driverPhone: data.driverPhone || null }
        : {}),
      ...(data.bookingReference !== undefined
        ? { bookingReference: data.bookingReference || null }
        : {}),
      ...(data.currentStatus ? { currentStatus: data.currentStatus } : {}),
    } as Prisma.TripUpdateInput & Prisma.TripCreateInput;
  }

  private buildWhere(query: ListTripsQueryDto): Prisma.TripWhereInput {
    return {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                cargo: {
                  code: { contains: query.search },
                },
              },
              {
                cargo: {
                  origin: { contains: query.search },
                },
              },
              {
                cargo: {
                  destination: {
                    contains: query.search,
                  },
                },
              },
              {
                driver: {
                  fullName: { contains: query.search },
                },
              },
              {
                truck: {
                  plateNumber: {
                    contains: query.search,
                  },
                },
              },
            ],
          }
        : {}),
      ...(query.cargoId ? { cargoId: query.cargoId } : {}),
      ...(query.truckId ? { truckId: query.truckId } : {}),
      ...(query.trailerId ? { trailerId: query.trailerId } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.currentStatus ? { currentStatus: query.currentStatus } : {}),
      // Filtros de "folha" (cliente + rota + dia de registo).
      ...(query.clientId || query.origin || query.destination
        ? {
            cargo: {
              ...(query.clientId ? { clientId: query.clientId } : {}),
              ...(query.origin ? { origin: query.origin } : {}),
              ...(query.destination ? { destination: query.destination } : {}),
            },
          }
        : {}),
      ...(query.day
        ? {
            createdAt: {
              gte: new Date(`${query.day}T00:00:00.000Z`),
              lt: new Date(`${query.day}T23:59:59.999Z`),
            },
          }
        : {}),
    };
  }

  /**
   * "Folhas" de atividades: viagens agrupadas por cliente + rota + dia de
   * registo, com contagem total e quantas já foram entregues. É a lista que
   * a página de acompanhamento mostra (cada folha é uma tabela operacional).
   */
  async listActivities(): Promise<
    Array<{
      clientId: string;
      clientName: string;
      origin: string;
      destination: string;
      day: string;
      total: number;
      delivered: number;
    }>
  > {
    const rows = await this.prisma.$queryRaw<
      Array<{
        clientId: string;
        clientName: string;
        origin: string;
        destination: string;
        day: string;
        total: bigint;
        delivered: bigint;
      }>
    >`
      SELECT
        c.clientId AS clientId,
        cl.companyName AS clientName,
        c.origin AS origin,
        c.destination AS destination,
        DATE_FORMAT(t.createdAt, '%Y-%m-%d') AS day,
        COUNT(*) AS total,
        SUM(t.currentStatus IN ('DISCHARGED', 'CONTAINER_RETURNED')) AS delivered
      FROM trips t
      JOIN cargos c ON c.id = t.cargoId
      JOIN clients cl ON cl.id = c.clientId
      WHERE t.deletedAt IS NULL
      GROUP BY c.clientId, cl.companyName, c.origin, c.destination, DATE_FORMAT(t.createdAt, '%Y-%m-%d')
      ORDER BY day DESC, cl.companyName ASC
    `;

    return rows.map((row) => ({
      clientId: row.clientId,
      clientName: row.clientName,
      origin: row.origin,
      destination: row.destination,
      day: row.day,
      total: Number(row.total),
      delivered: Number(row.delivered),
    }));
  }
}
