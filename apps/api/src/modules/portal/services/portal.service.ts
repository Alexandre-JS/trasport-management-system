import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PortalRepository } from '../repository/portal.repository';

@Injectable()
export class PortalService {
  constructor(private readonly portalRepository: PortalRepository) {}

  /** Resolve the client the authenticated user represents, or reject. */
  private async resolveClientId(userId: string): Promise<string> {
    const user = await this.portalRepository.getUserClientId(userId);

    if (!user?.clientId) {
      throw new ForbiddenException(
        'This account is not linked to a client and cannot access the portal.',
      );
    }

    return user.clientId;
  }

  async listShipments(userId: string) {
    const clientId = await this.resolveClientId(userId);
    return this.portalRepository.findClientTrips(clientId);
  }

  async getShipment(userId: string, tripId: string) {
    const clientId = await this.resolveClientId(userId);
    const trip = await this.portalRepository.findClientTrip(clientId, tripId);

    if (!trip) {
      throw new NotFoundException('Shipment not found');
    }

    return trip;
  }
}
