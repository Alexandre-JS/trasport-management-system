import { Injectable, NotFoundException } from '@nestjs/common';
import { CargoStatus } from '@prisma/client';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateCargoDto } from '../dto/create-cargo.dto';
import { ListCargoQueryDto } from '../dto/list-cargo-query.dto';
import { UpdateCargoStatusDto } from '../dto/update-cargo-status.dto';
import { UpdateCargoDto } from '../dto/update-cargo.dto';
import { CargoRepository } from '../repository/cargo.repository';

@Injectable()
export class CargoService {
  constructor(
    private readonly cargoRepository: CargoRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.cargoRepository.health();
  }

  async findAll(query: ListCargoQueryDto) {
    const { data, total } = await this.cargoRepository.findMany(query);

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
    const cargo = await this.cargoRepository.findById(id);

    if (!cargo) {
      throw new NotFoundException('Cargo not found');
    }

    return cargo;
  }

  async create(dto: CreateCargoDto) {
    await this.ensureClientExists(dto.clientId);

    const code = await this.generateCode();
    const cargo = await this.cargoRepository.create({ ...dto, code });

    this.logger.log(`Cargo created: ${cargo.id}`, CargoService.name);

    return cargo;
  }

  async update(id: string, dto: UpdateCargoDto) {
    await this.ensureCargoExists(id);

    if (dto.clientId) {
      await this.ensureClientExists(dto.clientId);
    }

    const cargo = await this.cargoRepository.update(id, dto);

    this.logger.log(`Cargo updated: ${cargo.id}`, CargoService.name);

    return cargo;
  }

  async updateStatus(id: string, dto: UpdateCargoStatusDto) {
    await this.ensureCargoExists(id);
    const cargo = await this.cargoRepository.updateStatus(id, dto.status);

    this.logger.log(
      `Cargo status changed: ${cargo.id} -> ${cargo.status}`,
      CargoService.name,
    );

    return cargo;
  }

  async cancel(id: string) {
    return this.updateStatus(id, { status: CargoStatus.CANCELLED });
  }

  async remove(id: string) {
    await this.ensureCargoExists(id);
    const cargo = await this.cargoRepository.softDelete(id);

    this.logger.log(`Cargo deleted: ${cargo.id}`, CargoService.name);

    return cargo;
  }

  private async ensureCargoExists(id: string) {
    const cargo = await this.cargoRepository.findById(id);

    if (!cargo) {
      throw new NotFoundException('Cargo not found');
    }

    return cargo;
  }

  private async ensureClientExists(clientId: string) {
    const clientExists = await this.cargoRepository.clientExists(clientId);

    if (!clientExists) {
      throw new NotFoundException('Client not found');
    }
  }

  private async generateCode(): Promise<string> {
    const date = new Date();
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const code = `SGRTC-${datePart}-${randomPart}`;
      const existingCargo = await this.cargoRepository.findByCode(code);

      if (!existingCargo) {
        return code;
      }
    }

    return `SGRTC-${datePart}-${Date.now()}`;
  }
}
