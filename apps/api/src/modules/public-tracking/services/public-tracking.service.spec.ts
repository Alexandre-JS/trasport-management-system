import { NotFoundException } from '@nestjs/common';
import { PublicTrackingService } from './public-tracking.service';

describe('PublicTrackingService', () => {
  const repository = {
    findByToken: jest.fn(),
    findClientByToken: jest.fn(),
  };
  const service = new PublicTrackingService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes a shipment token to the common result shape', async () => {
    const shipment = { clientName: 'Cliente A', currentStatus: 'LOADED' };
    repository.findByToken.mockResolvedValue(shipment);

    await expect(service.track('shipment-token')).resolves.toEqual({
      clientName: 'Cliente A',
      shipments: [shipment],
    });
    expect(repository.findClientByToken).not.toHaveBeenCalled();
  });

  it('resolves a client token through the same endpoint', async () => {
    const result = { clientName: 'Cliente A', shipments: [{ id: 'trip-1' }] };
    repository.findByToken.mockResolvedValue(null);
    repository.findClientByToken.mockResolvedValue(result);

    await expect(service.track('client-token')).resolves.toBe(result);
  });

  it('rejects a token that matches neither a shipment nor a client', async () => {
    repository.findByToken.mockResolvedValue(null);
    repository.findClientByToken.mockResolvedValue(null);

    await expect(service.track('invalid-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
