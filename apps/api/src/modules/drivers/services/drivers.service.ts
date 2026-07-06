import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { ListDriversQueryDto } from '../dto/list-drivers-query.dto';
import { UpdateDriverStatusDto } from '../dto/update-driver-status.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { DriversRepository } from '../repository/drivers.repository';

@Injectable()
export class DriversService {
  constructor(
    private readonly driversRepository: DriversRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.driversRepository.health();
  }

  async findAll(query: ListDriversQueryDto) {
    const { data, total } = await this.driversRepository.findMany(query);

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
    const driver = await this.driversRepository.findById(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async create(dto: CreateDriverDto) {
    await this.ensureLicenseAvailable(dto.licenseNumber);
    await this.ensureUserCanBeLinked(dto.userId);

    const driver = await this.driversRepository.create(dto);

    this.logger.log(`Driver created: ${driver.id}`, DriversService.name);

    return driver;
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.ensureDriverExists(id);

    if (dto.licenseNumber) {
      await this.ensureLicenseAvailable(dto.licenseNumber, id);
    }

    if (dto.userId) {
      await this.ensureUserCanBeLinked(dto.userId, id);
    }

    const driver = await this.driversRepository.update(id, dto);

    this.logger.log(`Driver updated: ${driver.id}`, DriversService.name);

    return driver;
  }

  async updateStatus(id: string, dto: UpdateDriverStatusDto) {
    await this.ensureDriverExists(id);
    const driver = await this.driversRepository.updateStatus(id, dto.status);

    this.logger.log(
      `Driver status changed: ${driver.id} -> ${driver.status}`,
      DriversService.name,
    );

    return driver;
  }

  async setAvailable(id: string) {
    return this.updateStatus(id, { status: DriverStatus.AVAILABLE });
  }

  async setOffline(id: string) {
    return this.updateStatus(id, { status: DriverStatus.OFFLINE });
  }

  async deactivate(id: string) {
    return this.updateStatus(id, { status: DriverStatus.INACTIVE });
  }

  async remove(id: string) {
    await this.ensureDriverExists(id);
    const driver = await this.driversRepository.softDelete(id);

    this.logger.log(`Driver deleted: ${driver.id}`, DriversService.name);

    return driver;
  }

  async history(id: string) {
    const driver = await this.driversRepository.getHistory(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      driverId: driver.id,
      trips: driver.trips,
    };
  }

  private async ensureDriverExists(id: string) {
    const driver = await this.driversRepository.findById(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  private async ensureLicenseAvailable(
    licenseNumber: string,
    currentDriverId?: string,
  ) {
    const existingDriver =
      await this.driversRepository.findByLicenseNumber(licenseNumber);

    if (existingDriver && existingDriver.id !== currentDriverId) {
      throw new ConflictException('License number already in use');
    }
  }

  private async ensureUserCanBeLinked(
    userId?: string,
    currentDriverId?: string,
  ) {
    if (!userId) {
      return;
    }

    const userExists = await this.driversRepository.userExists(userId);

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const existingDriver = await this.driversRepository.findByUserId(userId);

    if (existingDriver && existingDriver.id !== currentDriverId) {
      throw new ConflictException('User is already linked to another driver');
    }
  }
}
