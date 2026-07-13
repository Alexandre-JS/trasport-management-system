import { ConflictException, NotFoundException } from '@nestjs/common';
import { DriverStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { DriversRepository } from '../repository/drivers.repository';
import { DriversService } from './drivers.service';

describe('DriversService', () => {
  const driversRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    findByLicenseNumber: jest.fn(),
    findByUserId: jest.fn(),
    userExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
    getHistory: jest.fn(),
  } as unknown as jest.Mocked<DriversRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const driver = {
    id: 'driver-id',
    userId: null,
    fullName: 'Carlos Mabunda',
    licenseNumber: 'MZ-DRV-0002',
    passportNumber: null,
    phone: '+258840000002',
    email: 'driver2@sgrtc.local',
    status: DriverStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: DriversService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DriversService(driversRepository, logger);
  });

  it('lists drivers with pagination metadata', async () => {
    driversRepository.findMany.mockResolvedValue({ data: [driver], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('creates a driver when license is available', async () => {
    driversRepository.findByLicenseNumber.mockResolvedValue(null);
    driversRepository.create.mockResolvedValue(driver);

    const result = await service.create({
      fullName: 'Carlos Mabunda',
      licenseNumber: 'MZ-DRV-0002',
    });

    expect(result.id).toBe('driver-id');
    expect(driversRepository.create.mock.calls[0][0].licenseNumber).toBe(
      'MZ-DRV-0002',
    );
  });

  it('rejects duplicate license number', async () => {
    driversRepository.findByLicenseNumber.mockResolvedValue(driver);

    await expect(
      service.create({
        fullName: 'Carlos Mabunda',
        licenseNumber: 'MZ-DRV-0002',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates driver status', async () => {
    driversRepository.findById.mockResolvedValue(driver);
    driversRepository.updateStatus.mockResolvedValue({
      ...driver,
      status: DriverStatus.OFFLINE,
    });

    const result = await service.setOffline('driver-id');

    expect(result.status).toBe(DriverStatus.OFFLINE);
  });

  it('throws when driver does not exist', async () => {
    driversRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-driver')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
