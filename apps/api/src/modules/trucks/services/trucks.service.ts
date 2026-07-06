import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TruckStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { ListTrucksQueryDto } from '../dto/list-trucks-query.dto';
import { UpdateTruckStatusDto } from '../dto/update-truck-status.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TrucksRepository } from '../repository/trucks.repository';

@Injectable()
export class TrucksService {
  constructor(
    private readonly trucksRepository: TrucksRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.trucksRepository.health();
  }

  async findAll(query: ListTrucksQueryDto) {
    const { data, total } = await this.trucksRepository.findMany(query);

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
    const truck = await this.trucksRepository.findById(id);

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return truck;
  }

  async create(dto: CreateTruckDto) {
    await this.ensurePlateAvailable(dto.plateNumber);
    const truck = await this.trucksRepository.create(dto);

    this.logger.log(`Truck created: ${truck.id}`, TrucksService.name);

    return truck;
  }

  async update(id: string, dto: UpdateTruckDto) {
    await this.ensureTruckExists(id);

    if (dto.plateNumber) {
      await this.ensurePlateAvailable(dto.plateNumber, id);
    }

    const truck = await this.trucksRepository.update(id, dto);

    this.logger.log(`Truck updated: ${truck.id}`, TrucksService.name);

    return truck;
  }

  async updateStatus(id: string, dto: UpdateTruckStatusDto) {
    await this.ensureTruckExists(id);
    const truck = await this.trucksRepository.updateStatus(id, dto.status);

    this.logger.log(
      `Truck status changed: ${truck.id} -> ${truck.status}`,
      TrucksService.name,
    );

    return truck;
  }

  async setAvailable(id: string) {
    return this.updateStatus(id, { status: TruckStatus.AVAILABLE });
  }

  async setMaintenance(id: string) {
    return this.updateStatus(id, { status: TruckStatus.MAINTENANCE });
  }

  async deactivate(id: string) {
    return this.updateStatus(id, { status: TruckStatus.INACTIVE });
  }

  async remove(id: string) {
    await this.ensureTruckExists(id);
    const truck = await this.trucksRepository.softDelete(id);

    this.logger.log(`Truck deleted: ${truck.id}`, TrucksService.name);

    return truck;
  }

  private async ensureTruckExists(id: string) {
    const truck = await this.trucksRepository.findById(id);

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return truck;
  }

  private async ensurePlateAvailable(
    plateNumber: string,
    currentTruckId?: string,
  ) {
    const existingTruck =
      await this.trucksRepository.findByPlateNumber(plateNumber);

    if (existingTruck && existingTruck.id !== currentTruckId) {
      throw new ConflictException('Plate number already in use');
    }
  }
}
