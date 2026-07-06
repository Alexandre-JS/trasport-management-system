import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DriverStatus,
  TripEventType,
  TripStatus,
  TruckStatus,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { TripStateMachine } from '../domain/trip-state-machine';
import { TripsRepository } from './trips.repository';

/**
 * These specs exercise the transactional integrity guarantees. The interactive
 * `$transaction(cb)` is mocked to run the callback against a mock `tx`, so we can
 * assert that: validation happens before any write (nothing is persisted on
 * failure), the anti-double-booking query derives its status set from the state
 * machine, and resources are released symmetrically on terminal states.
 */
describe('TripsRepository (transactional integrity)', () => {
  const TRIP_ID = 'trip-1';
  const DRIVER_ID = 'driver-1';
  const TRUCK_ID = 'truck-1';
  const CARGO_ID = 'cargo-1';

  let tx: {
    trip: { findFirst: jest.Mock; update: jest.Mock; count: jest.Mock };
    driver: { findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    truck: { findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    cargo: { findFirst: jest.Mock };
    tripEvent: { create: jest.Mock };
  };
  let repo: TripsRepository;

  beforeEach(() => {
    tx = {
      trip: { findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      driver: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      truck: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      cargo: { findFirst: jest.fn() },
      tripEvent: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaService;
    repo = new TripsRepository(prisma, new TripStateMachine());
  });

  describe('assignDriver', () => {
    it('assigns and marks the driver ON_TRIP when available and free', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.driver.findFirst.mockResolvedValue({
        id: DRIVER_ID,
        status: DriverStatus.AVAILABLE,
      });
      tx.trip.count.mockResolvedValue(0);
      tx.trip.update.mockResolvedValue({ id: TRIP_ID, driverId: DRIVER_ID });

      await repo.assignDriver(TRIP_ID, DRIVER_ID);

      expect(tx.driver.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DRIVER_ID },
          data: { status: DriverStatus.ON_TRIP },
        }),
      );
      expect(tx.trip.update).toHaveBeenCalled();
    });

    it('derives the anti-double-booking query from occupyingStatuses (excludes terminal)', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.driver.findFirst.mockResolvedValue({
        id: DRIVER_ID,
        status: DriverStatus.AVAILABLE,
      });
      tx.trip.count.mockResolvedValue(0);
      tx.trip.update.mockResolvedValue({ id: TRIP_ID });

      await repo.assignDriver(TRIP_ID, DRIVER_ID);

      const where = tx.trip.count.mock.calls[0][0].where;
      expect(where.currentStatus.in).toContain(TripStatus.WAITING_APPOINTMENT);
      expect(where.currentStatus.in).not.toContain(TripStatus.DISCHARGED);
      expect(where.currentStatus.in).not.toContain(TripStatus.CANCELLED);
      expect(where.id).toEqual({ not: TRIP_ID });
    });

    it('rejects when the driver is not AVAILABLE and persists nothing', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.driver.findFirst.mockResolvedValue({
        id: DRIVER_ID,
        status: DriverStatus.ON_TRIP,
      });

      await expect(repo.assignDriver(TRIP_ID, DRIVER_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.driver.update).not.toHaveBeenCalled();
      expect(tx.trip.update).not.toHaveBeenCalled();
    });

    it('rejects double-booking (driver on another occupying trip) and persists nothing', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.driver.findFirst.mockResolvedValue({
        id: DRIVER_ID,
        status: DriverStatus.AVAILABLE,
      });
      tx.trip.count.mockResolvedValue(1);

      await expect(repo.assignDriver(TRIP_ID, DRIVER_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.driver.update).not.toHaveBeenCalled();
      expect(tx.trip.update).not.toHaveBeenCalled();
    });

    it('rejects assigning to a terminal trip', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.DISCHARGED,
      });

      await expect(repo.assignDriver(TRIP_ID, DRIVER_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.driver.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('assignTruck', () => {
    it('assigns and marks the truck ON_TRIP when available and free', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.LOADED,
      });
      tx.truck.findFirst.mockResolvedValue({
        id: TRUCK_ID,
        status: TruckStatus.AVAILABLE,
      });
      tx.trip.count.mockResolvedValue(0);
      tx.trip.update.mockResolvedValue({ id: TRIP_ID, truckId: TRUCK_ID });

      await repo.assignTruck(TRIP_ID, TRUCK_ID);

      expect(tx.truck.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: TruckStatus.ON_TRIP } }),
      );
    });

    it('rejects when the truck is in MAINTENANCE and persists nothing', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.LOADED,
      });
      tx.truck.findFirst.mockResolvedValue({
        id: TRUCK_ID,
        status: TruckStatus.MAINTENANCE,
      });

      await expect(repo.assignTruck(TRIP_ID, TRUCK_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.truck.update).not.toHaveBeenCalled();
      expect(tx.trip.update).not.toHaveBeenCalled();
    });
  });

  describe('assignCargo (anti-double-booking only, never touches CargoStatus)', () => {
    it('assigns without mutating any resource status', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.cargo.findFirst.mockResolvedValue({ id: CARGO_ID });
      tx.trip.count.mockResolvedValue(0);
      tx.trip.update.mockResolvedValue({ id: TRIP_ID, cargoId: CARGO_ID });

      await repo.assignCargo(TRIP_ID, CARGO_ID);

      expect(tx.trip.update).toHaveBeenCalled();
      expect(tx.driver.update).not.toHaveBeenCalled();
      expect(tx.truck.update).not.toHaveBeenCalled();
    });

    it('rejects when the cargo is already on another occupying trip', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
      });
      tx.cargo.findFirst.mockResolvedValue({ id: CARGO_ID });
      tx.trip.count.mockResolvedValue(1);

      await expect(repo.assignCargo(TRIP_ID, CARGO_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.trip.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus (transition + milestone + symmetric release)', () => {
    it('applies a legal transition and records the milestone event', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.LOADED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.DISPATCHED_ORIGIN,
      });

      await repo.updateStatus(TRIP_ID, TripStatus.DISPATCHED_ORIGIN);

      expect(tx.tripEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TripEventType.DISPATCHED_ORIGIN,
            fromStatus: TripStatus.LOADED,
            toStatus: TripStatus.DISPATCHED_ORIGIN,
          }),
        }),
      );
      // Not terminal -> resources stay held.
      expect(tx.driver.updateMany).not.toHaveBeenCalled();
      expect(tx.truck.updateMany).not.toHaveBeenCalled();
    });

    it('rejects an illegal transition and persists nothing', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.LOADED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });

      await expect(
        repo.updateStatus(TRIP_ID, TripStatus.DISCHARGED),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.trip.update).not.toHaveBeenCalled();
      expect(tx.tripEvent.create).not.toHaveBeenCalled();
    });

    it('preserves arrivalDate and releases driver & truck on DISCHARGED', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.ARRIVED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.DISCHARGED,
      });

      await repo.updateStatus(TRIP_ID, TripStatus.DISCHARGED);

      expect(tx.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStatus: TripStatus.DISCHARGED,
            arrivalDate: expect.any(Date),
          }),
        }),
      );
      expect(tx.driver.updateMany).toHaveBeenCalledWith({
        where: { id: DRIVER_ID, status: DriverStatus.ON_TRIP },
        data: { status: DriverStatus.AVAILABLE },
      });
      expect(tx.truck.updateMany).toHaveBeenCalledWith({
        where: { id: TRUCK_ID, status: TruckStatus.ON_TRIP },
        data: { status: TruckStatus.AVAILABLE },
      });
    });

    it('audits an administrative transition as STATUS_CHANGE with from/to', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.APPOINTMENT_DONE,
      });

      await repo.updateStatus(TRIP_ID, TripStatus.APPOINTMENT_DONE);

      expect(tx.tripEvent.create).toHaveBeenCalledTimes(1);
      expect(tx.tripEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TripEventType.STATUS_CHANGE,
            fromStatus: TripStatus.WAITING_APPOINTMENT,
            toStatus: TripStatus.APPOINTMENT_DONE,
          }),
        }),
      );
    });

    it('cancelling via updateStatus is audited (STATUS_CHANGE) and releases resources safely', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.AT_BORDER,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.CANCELLED,
      });
      tx.driver.updateMany.mockResolvedValue({ count: 1 });
      tx.truck.updateMany.mockResolvedValue({ count: 1 });

      await repo.updateStatus(TRIP_ID, TripStatus.CANCELLED);

      expect(tx.driver.updateMany).toHaveBeenCalledWith({
        where: { id: DRIVER_ID, status: DriverStatus.ON_TRIP },
        data: { status: DriverStatus.AVAILABLE },
      });
      expect(tx.tripEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TripEventType.STATUS_CHANGE,
            fromStatus: TripStatus.AT_BORDER,
            toStatus: TripStatus.CANCELLED,
          }),
        }),
      );
    });
  });

  describe('recordMilestone (endpoint path)', () => {
    it('drives the matching transition and creates the event atomically', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.BORDER_CLEARED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.ARRIVED,
      });

      await repo.recordMilestone(
        TRIP_ID,
        { type: TripEventType.ARRIVED, note: 'gate 3' },
        'user-1',
      );

      expect(tx.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStatus: TripStatus.ARRIVED }),
        }),
      );
      expect(tx.tripEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TripEventType.ARRIVED,
            fromStatus: TripStatus.BORDER_CLEARED,
            toStatus: TripStatus.ARRIVED,
            note: 'gate 3',
            createdBy: 'user-1',
          }),
        }),
      );
    });

    it('rejects a milestone that skips steps and persists nothing', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.BORDER_CLEARED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });

      await expect(
        repo.recordMilestone(TRIP_ID, { type: TripEventType.DISCHARGED }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.trip.update).not.toHaveBeenCalled();
      expect(tx.tripEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('softDelete (delete = cancellation + release + audit)', () => {
    it('cancels, releases resources and audits it on an active trip', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.AT_BORDER,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.CANCELLED,
      });

      await repo.softDelete(TRIP_ID, 'user-1');

      expect(tx.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStatus: TripStatus.CANCELLED,
            deletedAt: expect.any(Date),
          }),
        }),
      );
      expect(tx.driver.updateMany).toHaveBeenCalledWith({
        where: { id: DRIVER_ID, status: DriverStatus.ON_TRIP },
        data: { status: DriverStatus.AVAILABLE },
      });
      expect(tx.truck.updateMany).toHaveBeenCalledWith({
        where: { id: TRUCK_ID, status: TruckStatus.ON_TRIP },
        data: { status: TruckStatus.AVAILABLE },
      });
      // Cancellation via remove() is now auditable.
      expect(tx.tripEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TripEventType.STATUS_CHANGE,
            fromStatus: TripStatus.AT_BORDER,
            toStatus: TripStatus.CANCELLED,
            createdBy: 'user-1',
          }),
        }),
      );
    });

    it('is a safe no-op on the release when no resource is held', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.WAITING_APPOINTMENT,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.CANCELLED,
      });
      tx.driver.updateMany.mockResolvedValue({ count: 0 });
      tx.truck.updateMany.mockResolvedValue({ count: 0 });

      await expect(repo.softDelete(TRIP_ID)).resolves.toBeDefined();
      // Guarded by ON_TRIP -> matches nothing, never throws.
      expect(tx.driver.updateMany).toHaveBeenCalled();
    });

    it('deletes an already CANCELLED trip without a duplicate audit event', async () => {
      tx.trip.findFirst.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.CANCELLED,
        driverId: DRIVER_ID,
        truckId: TRUCK_ID,
      });
      tx.trip.update.mockResolvedValue({
        id: TRIP_ID,
        currentStatus: TripStatus.CANCELLED,
      });
      tx.driver.updateMany.mockResolvedValue({ count: 0 });
      tx.truck.updateMany.mockResolvedValue({ count: 0 });

      await expect(repo.softDelete(TRIP_ID)).resolves.toBeDefined();
      // Already cancelled -> not a real transition, so no noisy event.
      expect(tx.tripEvent.create).not.toHaveBeenCalled();
      expect(tx.cargo.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFound and persists nothing when the trip does not exist', async () => {
      tx.trip.findFirst.mockResolvedValue(null);

      await expect(repo.softDelete(TRIP_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(tx.trip.update).not.toHaveBeenCalled();
      expect(tx.driver.updateMany).not.toHaveBeenCalled();
      expect(tx.tripEvent.create).not.toHaveBeenCalled();
    });
  });
});
