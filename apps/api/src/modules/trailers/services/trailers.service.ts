import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TrailerStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateTrailerDto } from '../dto/create-trailer.dto';
import { ListTrailersQueryDto } from '../dto/list-trailers-query.dto';
import { UpdateTrailerStatusDto } from '../dto/update-trailer-status.dto';
import { UpdateTrailerDto } from '../dto/update-trailer.dto';
import { TrailersRepository } from '../repository/trailers.repository';

@Injectable()
export class TrailersService {
  constructor(
    private readonly trailersRepository: TrailersRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.trailersRepository.health();
  }

  async findAll(query: ListTrailersQueryDto) {
    const { data, total } = await this.trailersRepository.findMany(query);

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
    const trailer = await this.trailersRepository.findById(id);

    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }

    return trailer;
  }

  async create(dto: CreateTrailerDto) {
    await this.ensurePlateAvailable(dto.plateNumber);
    await this.ensureTruckExistsIfPresent(dto.truckId);

    const trailer = await this.trailersRepository.create(dto);

    this.logger.log(`Trailer created: ${trailer.id}`, TrailersService.name);

    return trailer;
  }

  async update(id: string, dto: UpdateTrailerDto) {
    await this.ensureTrailerExists(id);

    if (dto.plateNumber) {
      await this.ensurePlateAvailable(dto.plateNumber, id);
    }

    await this.ensureTruckExistsIfPresent(dto.truckId);

    const trailer = await this.trailersRepository.update(id, dto);

    this.logger.log(`Trailer updated: ${trailer.id}`, TrailersService.name);

    return trailer;
  }

  async updateStatus(id: string, dto: UpdateTrailerStatusDto) {
    await this.ensureTrailerExists(id);
    const trailer = await this.trailersRepository.updateStatus(id, dto.status);

    this.logger.log(
      `Trailer status changed: ${trailer.id} -> ${trailer.status}`,
      TrailersService.name,
    );

    return trailer;
  }

  async setAvailable(id: string) {
    return this.updateStatus(id, { status: TrailerStatus.AVAILABLE });
  }

  async setMaintenance(id: string) {
    return this.updateStatus(id, { status: TrailerStatus.MAINTENANCE });
  }

  async deactivate(id: string) {
    return this.updateStatus(id, { status: TrailerStatus.INACTIVE });
  }

  async remove(id: string) {
    await this.ensureTrailerExists(id);
    const trailer = await this.trailersRepository.softDelete(id);

    this.logger.log(`Trailer deleted: ${trailer.id}`, TrailersService.name);

    return trailer;
  }

  private async ensureTrailerExists(id: string) {
    const trailer = await this.trailersRepository.findById(id);

    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }

    return trailer;
  }

  private async ensureTruckExistsIfPresent(truckId?: string) {
    if (!truckId) {
      return;
    }

    const truckExists = await this.trailersRepository.truckExists(truckId);

    if (!truckExists) {
      throw new NotFoundException('Truck not found');
    }
  }

  private async ensurePlateAvailable(
    plateNumber: string,
    currentTrailerId?: string,
  ) {
    const existingTrailer =
      await this.trailersRepository.findByPlateNumber(plateNumber);

    if (existingTrailer && existingTrailer.id !== currentTrailerId) {
      throw new ConflictException('Plate number already in use');
    }
  }
}
