import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { RealtimeGateway } from '../../../core/events/realtime.gateway';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { TrackingRepository } from '../repository/tracking.repository';
import { TrackingService } from './tracking.service';

describe('TrackingService', () => {
  const trackingRepository = {
    health: jest.fn(),
    tripExists: jest.fn(),
    create: jest.fn(),
    findLast: jest.fn(),
    findMany: jest.fn(),
    findRoute: jest.fn(),
    updateTripPositionIfChanged: jest.fn(),
  } as unknown as jest.Mocked<TrackingRepository>;
  const gateway = {
    publish: jest.fn(),
    publishToTrip: jest.fn(),
  } as unknown as jest.Mocked<RealtimeGateway>;
  const logger = {
    log: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;

  const point = {
    id: 'point-id',
    tripId: 'trip-id',
    latitude: new Decimal(-25.9655),
    longitude: new Decimal(32.5832),
    speed: new Decimal(62.5),
    heading: new Decimal(180),
    accuracy: new Decimal(5),
    recordedAt: new Date('2026-07-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let service: TrackingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrackingService(trackingRepository, gateway, logger);
  });

  it('records a GPS point and broadcasts it over WebSocket', async () => {
    trackingRepository.tripExists.mockResolvedValue(true);
    trackingRepository.create.mockResolvedValue(point);

    const result = await service.recordPoint('trip-id', {
      latitude: -25.9655,
      longitude: 32.5832,
      speed: 62.5,
    });

    expect(result.id).toBe('point-id');
    expect(gateway.publishToTrip.mock.calls[0][0]).toBe('trip-id');
    expect(gateway.publishToTrip.mock.calls[0][1]).toBe('tracking:update');
    expect(gateway.publish.mock.calls[0][0]).toBe('cargo:locationUpdated');
  });

  it('rejects recording a point for an unknown trip', async () => {
    trackingRepository.tripExists.mockResolvedValue(false);

    await expect(
      service.recordPoint('missing-trip', {
        latitude: -25.9655,
        longitude: 32.5832,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(trackingRepository.create.mock.calls).toHaveLength(0);
  });

  it('returns the last known location', async () => {
    trackingRepository.tripExists.mockResolvedValue(true);
    trackingRepository.findLast.mockResolvedValue(point);

    const result = await service.getLastLocation('trip-id');

    expect(result.id).toBe('point-id');
  });

  it('throws when no location has been recorded yet', async () => {
    trackingRepository.tripExists.mockResolvedValue(true);
    trackingRepository.findLast.mockResolvedValue(null);

    await expect(service.getLastLocation('trip-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists GPS history with pagination metadata', async () => {
    trackingRepository.tripExists.mockResolvedValue(true);
    trackingRepository.findMany.mockResolvedValue({ data: [point], total: 1 });

    const result = await service.getHistory('trip-id', {
      page: 1,
      limit: 50,
      sortOrder: 'asc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('returns a map-ready ordered route', async () => {
    trackingRepository.tripExists.mockResolvedValue(true);
    trackingRepository.findRoute.mockResolvedValue([
      {
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        heading: point.heading,
        recordedAt: point.recordedAt,
      },
    ]);

    const result = await service.getRoute('trip-id');

    expect(result.tripId).toBe('trip-id');
    expect(result.count).toBe(1);
    expect(result.points).toHaveLength(1);
  });
});
