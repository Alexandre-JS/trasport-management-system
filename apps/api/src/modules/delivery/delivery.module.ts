import { Module } from '@nestjs/common';
import { EventsModule } from '../../core/events/events.module';
import { DeliveryController } from './controller/delivery.controller';
import { DeliveryRepository } from './repository/delivery.repository';
import { DeliveryService } from './services/delivery.service';

@Module({
  imports: [EventsModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryRepository],
})
export class DeliveryModule {}
