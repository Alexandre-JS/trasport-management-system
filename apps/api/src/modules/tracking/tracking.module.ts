import { Module } from '@nestjs/common';
import { EventsModule } from '../../core/events/events.module';
import { TrackingController } from './controller/tracking.controller';
import { TrackingRepository } from './repository/tracking.repository';
import { TrackingService } from './services/tracking.service';

@Module({
  imports: [EventsModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingRepository],
  exports: [TrackingService],
})
export class TrackingModule {}
