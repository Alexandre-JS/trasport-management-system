import { Module } from '@nestjs/common';
import { EventsModule } from '../../core/events/events.module';
import { IncidentsController } from './controller/incidents.controller';
import { IncidentsRepository } from './repository/incidents.repository';
import { IncidentsService } from './services/incidents.service';

@Module({
  imports: [EventsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsRepository],
  exports: [IncidentsService],
})
export class IncidentsModule {}
