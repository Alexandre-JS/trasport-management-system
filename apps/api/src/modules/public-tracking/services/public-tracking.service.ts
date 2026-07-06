import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicTrackingRepository } from '../repository/public-tracking.repository';

@Injectable()
export class PublicTrackingService {
  constructor(
    private readonly publicTrackingRepository: PublicTrackingRepository,
  ) {}

  async track(token: string) {
    const shipment = await this.publicTrackingRepository.findByToken(token);

    if (!shipment) {
      throw new NotFoundException('Tracking link not found');
    }

    return shipment;
  }
}
