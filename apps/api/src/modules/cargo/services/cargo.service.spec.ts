import { NotFoundException } from '@nestjs/common';
import { CargoStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CargoRepository } from '../repository/cargo.repository';
import { CargoService } from './cargo.service';

describe('CargoService', () => {
  const cargoRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    clientExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<CargoRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const cargo = {
    id: 'cargo-id',
    clientId: 'client-id',
    code: 'SGRTC-20260701-1234',
    description: 'Carga de teste',
    weightKg: null,
    volumeM3: null,
    origin: 'Maputo',
    destination: 'Beira',
    pickupDate: null,
    expectedDelivery: null,
    status: CargoStatus.CREATED,
    observations: null,
    client: {
      id: 'client-id',
      companyName: 'Moz Freight',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: CargoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CargoService(cargoRepository, logger);
  });

  it('lists cargo with pagination metadata', async () => {
    cargoRepository.findMany.mockResolvedValue({ data: [cargo], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('creates cargo with automatic code', async () => {
    cargoRepository.clientExists.mockResolvedValue(true);
    cargoRepository.findByCode.mockResolvedValue(null);
    cargoRepository.create.mockResolvedValue(cargo);

    const result = await service.create({
      clientId: 'client-id',
      origin: 'Maputo',
      destination: 'Beira',
      weightKg: 1200,
    });

    expect(result.id).toBe('cargo-id');
    expect(cargoRepository.create.mock.calls[0][0].code).toMatch(/^SGRTC-/);
  });

  it('rejects cargo creation for unknown client', async () => {
    cargoRepository.clientExists.mockResolvedValue(false);

    await expect(
      service.create({
        clientId: 'missing-client',
        origin: 'Maputo',
        destination: 'Beira',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates cargo status', async () => {
    cargoRepository.findById.mockResolvedValue(cargo);
    cargoRepository.updateStatus.mockResolvedValue({
      ...cargo,
      status: CargoStatus.IN_TRANSIT,
    });

    const result = await service.updateStatus('cargo-id', {
      status: CargoStatus.IN_TRANSIT,
    });

    expect(result.status).toBe(CargoStatus.IN_TRANSIT);
  });
});
