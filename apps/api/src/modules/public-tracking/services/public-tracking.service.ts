import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicTrackingRepository } from '../repository/public-tracking.repository';

@Injectable()
export class PublicTrackingService {
  constructor(
    private readonly publicTrackingRepository: PublicTrackingRepository,
  ) {}

  async track(token: string) {
    const shipment = await this.publicTrackingRepository.findByToken(token);

    if (shipment) {
      return {
        clientName: shipment.clientName,
        shipments: [shipment],
      };
    }

    const clientTracking =
      await this.publicTrackingRepository.findClientByToken(token);

    if (!clientTracking) {
      throw new NotFoundException('Tracking link not found');
    }

    return clientTracking;
  }

  async trackClient(token: string) {
    const result = await this.publicTrackingRepository.findClientByToken(token);

    if (!result) {
      throw new NotFoundException('Tracking link not found');
    }

    return result;
  }
}
