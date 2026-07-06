import { Injectable, NotFoundException } from '@nestjs/common';
import { CargoStatus, IncidentType, NotificationType } from '@prisma/client';
import { RealtimeGateway } from '../../../core/events/realtime.gateway';
import { AppLoggerService } from '../../../core/logger/app-logger.service';
import { NotificationDispatcherService } from '../../../core/notifications/notification-dispatcher.service';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { ListIncidentsQueryDto } from '../dto/list-incidents-query.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { IncidentsRepository } from '../repository/incidents.repository';

const OPERATIONS_ROLES = ['ADMIN', 'DISPATCHER'];

@Injectable()
export class IncidentsService {
  constructor(
    private readonly incidentsRepository: IncidentsRepository,
    private readonly notifications: NotificationDispatcherService,
    private readonly gateway: RealtimeGateway,
    private readonly logger: AppLoggerService,
  ) {}

  health() {
    return this.incidentsRepository.health();
  }

  getTypes() {
    return Object.values(IncidentType);
  }

  async findAll(query: ListIncidentsQueryDto) {
    const { data, total } = await this.incidentsRepository.findMany(query);

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
    const incident = await this.incidentsRepository.findById(id);

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async create(dto: CreateIncidentDto) {
    const trip = await this.incidentsRepository.findTripForIncident(dto.tripId);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const incident = await this.incidentsRepository.create(dto);
    await this.incidentsRepository.markCargoIncident(trip.cargoId);

    this.gateway.publish('incident:created', {
      id: incident.id,
      tripId: incident.tripId,
      type: incident.type,
    });
    this.gateway.publish('cargo:statusChanged', {
      cargoId: trip.cargoId,
      tripId: trip.id,
      status: CargoStatus.INCIDENT,
    });

    await this.notifications.notifyRoles(OPERATIONS_ROLES, {
      title: 'Novo incidente',
      message: `Incidente (${incident.type}) reportado na viagem ${trip.id}.`,
      type: NotificationType.WARNING,
    });

    this.logger.log(
      `Incident created: ${incident.id} (${incident.type})`,
      IncidentsService.name,
    );

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto) {
    await this.findOne(id);

    return this.incidentsRepository.update(id, dto);
  }

  async resolve(id: string) {
    await this.findOne(id);
    const incident = await this.incidentsRepository.resolve(id);

    this.logger.log(`Incident resolved: ${incident.id}`, IncidentsService.name);

    return incident;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.incidentsRepository.remove(id);
  }
}
