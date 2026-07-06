import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientsRepository } from '../repository/clients.repository';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.clientsRepository.health();
  }

  async findAll(query: ListClientsQueryDto) {
    const { data, total } = await this.clientsRepository.findMany(query);

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
    const client = await this.clientsRepository.findById(id);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    const client = await this.clientsRepository.create(dto);

    this.logger.log(`Client created: ${client.id}`, ClientsService.name);

    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureClientExists(id);
    const client = await this.clientsRepository.update(id, dto);

    this.logger.log(`Client updated: ${client.id}`, ClientsService.name);

    return client;
  }

  async activate(id: string) {
    await this.ensureClientExists(id);
    const client = await this.clientsRepository.setActive(id, true);

    this.logger.log(`Client activated: ${client.id}`, ClientsService.name);

    return client;
  }

  async deactivate(id: string) {
    await this.ensureClientExists(id);
    const client = await this.clientsRepository.setActive(id, false);

    this.logger.log(`Client deactivated: ${client.id}`, ClientsService.name);

    return client;
  }

  async remove(id: string) {
    await this.ensureClientExists(id);
    const client = await this.clientsRepository.softDelete(id);

    this.logger.log(`Client deleted: ${client.id}`, ClientsService.name);

    return client;
  }

  async history(id: string) {
    const client = await this.clientsRepository.getHistory(id);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return {
      clientId: client.id,
      cargos: client.cargos,
    };
  }

  private async ensureClientExists(id: string) {
    const client = await this.clientsRepository.findById(id);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }
}
