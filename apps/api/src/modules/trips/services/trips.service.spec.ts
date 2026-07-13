import { NotFoundException } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { TripsRepository } from '../repository/trips.repository';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  const tripsRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    cargoExists: jest.fn(),
    driverExists: jest.fn(),
    truckExists: jest.fn(),
    trailerExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    assignDriver: jest.fn(),
    assignTruck: jest.fn(),
    assignTrailer: jest.fn(),
    assignCargo: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<TripsRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const trip = {
    id: 'trip-id',
    cargoId: 'cargo-id',
    truckId: 'truck-id',
    trailerId: 'trailer-id',
    driverId: 'driver-id',
    departureDate: null,
    arrivalEstimate: null,
    arrivalDate: null,
    loadedDate: null,
    currentStatus: TripStatus.WAITING_APPOINTMENT,
    currentPosition: null,
    borders: [],
    tonnage: null,
    cargo: {
      id: 'cargo-id',
      code: 'SGRTC-20260701-1234',
      origin: 'Maputo',
      destination: 'Beira',
    },
    driver: {
      id: 'driver-id',
      fullName: 'Carlos Mabunda',
      licenseNumber: 'MZ-DRV-0001',
      passportNumber: null,
    },
    truck: {
      id: 'truck-id',
      plateNumber: 'AAA-001-MP',
    },
    trailer: {
      id: 'trailer-id',
      plateNumber: 'TRL-001-MP',
    },
    trackingToken: 'trip-token',
    events: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: TripsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TripsService(tripsRepository, logger);
  });

  it('lists trips with pagination metadata', async () => {
    tripsRepository.findMany.mockResolvedValue({ data: [trip], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('creates a trip when cargo, truck, trailer and driver exist', async () => {
    tripsRepository.cargoExists.mockResolvedValue(true);
    tripsRepository.truckExists.mockResolvedValue(true);
    tripsRepository.trailerExists.mockResolvedValue(true);
    tripsRepository.driverExists.mockResolvedValue(true);
    tripsRepository.create.mockResolvedValue(trip);

    const result = await service.create({
      cargoId: 'cargo-id',
      truckId: 'truck-id',
      trailerId: 'trailer-id',
      driverId: 'driver-id',
    });

    expect(result.id).toBe('trip-id');
  });

  it('rejects creation with unknown cargo', async () => {
    tripsRepository.cargoExists.mockResolvedValue(false);

    await expect(
      service.create({
        cargoId: 'missing-cargo',
        truckId: 'truck-id',
        trailerId: 'trailer-id',
        driverId: 'driver-id',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('closes a trip', async () => {
    tripsRepository.findById.mockResolvedValue(trip);
    tripsRepository.updateStatus.mockResolvedValue({
      ...trip,
      currentStatus: TripStatus.DISCHARGED,
      arrivalDate: new Date(),
    });

    const result = await service.close('trip-id');

    expect(result.currentStatus).toBe(TripStatus.DISCHARGED);
  });

  it('assigns a driver', async () => {
    tripsRepository.findById.mockResolvedValue(trip);
    tripsRepository.driverExists.mockResolvedValue(true);
    tripsRepository.assignDriver.mockResolvedValue({
      ...trip,
      driverId: 'next-driver-id',
    });

    const result = await service.assignDriver('trip-id', {
      driverId: 'next-driver-id',
    });

    expect(result.driverId).toBe('next-driver-id');
  });
});
