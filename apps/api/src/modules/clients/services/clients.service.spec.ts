import { NotFoundException } from '@nestjs/common';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { ClientsRepository } from '../repository/clients.repository';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  const clientsRepository = {
    health: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    softDelete: jest.fn(),
    getHistory: jest.fn(),
  } as unknown as jest.Mocked<ClientsRepository>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const client = {
    id: 'client-id',
    companyName: 'Moz Freight',
    contactName: 'Ana',
    nuit: '400000001',
    phone: '+258850000001',
    email: 'contacto@mozfreight.local',
    address: 'Av. 25 de Setembro',
    city: 'Maputo',
    province: 'Maputo',
    country: 'Moçambique',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: ClientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClientsService(clientsRepository, logger);
  });

  it('lists clients with pagination metadata', async () => {
    clientsRepository.findMany.mockResolvedValue({ data: [client], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('creates a client', async () => {
    clientsRepository.create.mockResolvedValue(client);

    const result = await service.create({
      companyName: 'Moz Freight',
      email: 'contacto@mozfreight.local',
    });

    expect(result.id).toBe('client-id');
    expect(clientsRepository.create.mock.calls[0][0].companyName).toBe(
      'Moz Freight',
    );
  });

  it('throws when client does not exist', async () => {
    clientsRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-client')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns client history', async () => {
    clientsRepository.getHistory.mockResolvedValue({
      id: 'client-id',
      cargos: [],
    });

    const result = await service.history('client-id');

    expect(result.clientId).toBe('client-id');
    expect(result.cargos).toEqual([]);
  });
});
