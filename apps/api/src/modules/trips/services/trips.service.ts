import { Injectable, NotFoundException } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { AssignCargoDto } from '../dto/assign-cargo.dto';
import { AssignDriverDto } from '../dto/assign-driver.dto';
import { AssignTrailerDto } from '../dto/assign-trailer.dto';
import { AssignTruckDto } from '../dto/assign-truck.dto';
import { CreateTripDto } from '../dto/create-trip.dto';
import { ListTripsQueryDto } from '../dto/list-trips-query.dto';
import { RecordTripEventDto } from '../dto/record-trip-event.dto';
import { UpdateTripStatusDto } from '../dto/update-trip-status.dto';
import { UpdateTripDto } from '../dto/update-trip.dto';
import { TripsRepository } from '../repository/trips.repository';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.tripsRepository.health();
  }

  async findAll(query: ListTripsQueryDto) {
    const { data, total } = await this.tripsRepository.findMany(query);

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

  async findOne(id: string) {
    const trip = await this.tripsRepository.findById(id);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async create(dto: CreateTripDto) {
    await this.ensureCargoExists(dto.cargoId);
    await this.ensureTruckExists(dto.truckId);
    await this.ensureTrailerExists(dto.trailerId);
    await this.ensureDriverExists(dto.driverId);

    const trip = await this.tripsRepository.create(dto);

    this.logger.log(`Trip created: ${trip.id}`, TripsService.name);

    return trip;
  }

  async update(id: string, dto: UpdateTripDto) {
    await this.ensureTripExists(id);

    if (dto.cargoId) {
      await this.ensureCargoExists(dto.cargoId);
    }

    if (dto.truckId) {
      await this.ensureTruckExists(dto.truckId);
    }

    if (dto.trailerId) {
      await this.ensureTrailerExists(dto.trailerId);
    }

    if (dto.driverId) {
      await this.ensureDriverExists(dto.driverId);
    }

    const trip = await this.tripsRepository.update(id, dto);

    this.logger.log(`Trip updated: ${trip.id}`, TripsService.name);

    return trip;
  }

  async updateStatus(id: string, dto: UpdateTripStatusDto) {
    // Existence + transition legality are enforced atomically in the repository.
    const trip = await this.tripsRepository.updateStatus(id, dto.currentStatus);

    this.logger.log(
      `Trip status changed: ${trip.id} -> ${trip.currentStatus}`,
      TripsService.name,
    );

    return trip;
  }

  async recordEvent(id: string, dto: RecordTripEventDto, createdBy?: string) {
    const trip = await this.tripsRepository.recordMilestone(id, dto, createdBy);

    this.logger.log(
      `Trip milestone ${dto.type} recorded: ${trip.id} -> ${trip.currentStatus}`,
      TripsService.name,
    );

    return trip;
  }

  async cancel(id: string) {
    return this.updateStatus(id, { currentStatus: TripStatus.CANCELLED });
  }

  async close(id: string) {
    return this.updateStatus(id, { currentStatus: TripStatus.DISCHARGED });
  }

  async assignDriver(id: string, dto: AssignDriverDto) {
    // Availability, anti-double-booking and ON_TRIP marking happen atomically
    // in a single transaction inside the repository.
    const trip = await this.tripsRepository.assignDriver(id, dto.driverId);

    this.logger.log(`Trip driver assigned: ${trip.id}`, TripsService.name);

    return trip;
  }

  async assignTruck(id: string, dto: AssignTruckDto) {
    const trip = await this.tripsRepository.assignTruck(id, dto.truckId);

    this.logger.log(`Trip truck assigned: ${trip.id}`, TripsService.name);

    return trip;
  }

  async assignTrailer(id: string, dto: AssignTrailerDto) {
    const trip = await this.tripsRepository.assignTrailer(id, dto.trailerId);

    this.logger.log(`Trip trailer assigned: ${trip.id}`, TripsService.name);

    return trip;
  }

  async assignCargo(id: string, dto: AssignCargoDto) {
    const trip = await this.tripsRepository.assignCargo(id, dto.cargoId);

    this.logger.log(`Trip cargo assigned: ${trip.id}`, TripsService.name);

    return trip;
  }

  async remove(id: string, createdBy?: string) {
    // Existence, resource release and cancellation audit happen atomically in
    // the repository.
    const trip = await this.tripsRepository.softDelete(id, createdBy);

    this.logger.log(`Trip deleted: ${trip.id}`, TripsService.name);

    return trip;
  }

  private async ensureTripExists(id: string) {
    const trip = await this.tripsRepository.findById(id);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  private async ensureCargoExists(cargoId: string) {
    const cargoExists = await this.tripsRepository.cargoExists(cargoId);

    if (!cargoExists) {
      throw new NotFoundException('Cargo not found');
    }
  }

  private async ensureTruckExists(truckId: string) {
    const truckExists = await this.tripsRepository.truckExists(truckId);

    if (!truckExists) {
      throw new NotFoundException('Truck not found');
    }
  }

  private async ensureTrailerExists(trailerId: string) {
    const trailerExists = await this.tripsRepository.trailerExists(trailerId);

    if (!trailerExists) {
      throw new NotFoundException('Trailer not found');
    }
  }

  private async ensureDriverExists(driverId: string) {
    const driverExists = await this.tripsRepository.driverExists(driverId);

    if (!driverExists) {
      throw new NotFoundException('Driver not found');
    }
  }
}
