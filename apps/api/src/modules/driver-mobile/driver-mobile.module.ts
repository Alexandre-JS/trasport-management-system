import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { TrackingModule } from '../tracking/tracking.module';
import { TripsModule } from '../trips/trips.module';
import { DriverMobileController } from './driver-mobile.controller';
import { DriverMobileService } from './driver-mobile.service';

@Module({
  imports: [TripsModule, DeliveryModule, IncidentsModule, TrackingModule],
  controllers: [DriverMobileController],
  providers: [DriverMobileService],
})
export class DriverMobileModule {}
