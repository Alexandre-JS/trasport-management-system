import { ConflictException, NotFoundException } from '@nestjs/common';
import { TruckStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { TrucksRepository } from '../repository/trucks.repository';
import { TrucksService } from './trucks.service';

describe('TrucksService', () => {
  const trucksRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    findByPlateNumber: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<TrucksRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const truck = {
    id: 'truck-id',
    plateNumber: 'SP5-001-MP',
    brand: 'Mercedes-Benz',
    model: 'Actros',
    year: 2022,
    status: TruckStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: TrucksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrucksService(trucksRepository, logger);
  });

  it('lists trucks with pagination metadata', async () => {
    trucksRepository.findMany.mockResolvedValue({ data: [truck], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('creates a truck when plate is available', async () => {
    trucksRepository.findByPlateNumber.mockResolvedValue(null);
    trucksRepository.create.mockResolvedValue(truck);

    const result = await service.create({
      plateNumber: 'SP5-001-MP',
    });

    expect(result.id).toBe('truck-id');
    expect(trucksRepository.create.mock.calls[0][0].plateNumber).toBe(
      'SP5-001-MP',
    );
  });

  it('rejects duplicate plate number', async () => {
    trucksRepository.findByPlateNumber.mockResolvedValue(truck);

    await expect(
      service.create({ plateNumber: 'SP5-001-MP' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates truck status', async () => {
    trucksRepository.findById.mockResolvedValue(truck);
    trucksRepository.updateStatus.mockResolvedValue({
      ...truck,
      status: TruckStatus.MAINTENANCE,
    });

    const result = await service.setMaintenance('truck-id');

    expect(result.status).toBe(TruckStatus.MAINTENANCE);
  });

  it('throws when truck does not exist', async () => {
    trucksRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-truck')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
