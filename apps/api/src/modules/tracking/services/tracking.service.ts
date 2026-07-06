import { Injectable, NotFoundException } from '@nestjs/common';
import { RealtimeGateway } from '../../../core/events/realtime.gateway';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateTrackingPointDto } from '../dto/create-tracking-point.dto';
import { ListTrackingQueryDto } from '../dto/list-tracking-query.dto';
import { TrackingRepository } from '../repository/tracking.repository';

@Injectable()
export class TrackingService {
  constructor(
    private readonly trackingRepository: TrackingRepository,
    private readonly gateway: RealtimeGateway,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.trackingRepository.health();
  }

  async recordPoint(tripId: string, dto: CreateTrackingPointDto) {
    await this.ensureTripExists(tripId);

    const point = await this.trackingRepository.create(tripId, dto);

    const payload = {
      tripId,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      heading: point.heading,
      accuracy: point.accuracy,
      recordedAt: point.recordedAt,
    };

    this.gateway.publishToTrip(tripId, 'tracking:update', payload);
    this.gateway.publish('cargo:locationUpdated', payload);

    this.logger.log(
      `Tracking point recorded for trip ${tripId}`,
      TrackingService.name,
    );

    return point;
  }

  async getLastLocation(tripId: string) {
    await this.ensureTripExists(tripId);

    const last = await this.trackingRepository.findLast(tripId);

    if (!last) {
      throw new NotFoundException('No location recorded for this trip yet');
    }

    return last;
  }

  async getHistory(tripId: string, query: ListTrackingQueryDto) {
    await this.ensureTripExists(tripId);

    const { data, total } = await this.trackingRepository.findMany(
      tripId,
      query,
    );

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getRoute(tripId: string) {
    await this.ensureTripExists(tripId);

    const points = await this.trackingRepository.findRoute(tripId);

    return {
      tripId,
      count: points.length,
      points,
    };
  }

  private async ensureTripExists(tripId: string) {
    const tripExists = await this.trackingRepository.tripExists(tripId);

    if (!tripExists) {
      throw new NotFoundException('Trip not found');
    }
  }
}
