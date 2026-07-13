import { Module } from '@nestjs/common';
import { TripsController } from './controller/trips.controller';
import { TripStateMachine } from './domain/trip-state-machine';
import { TripsRepository } from './repository/trips.repository';
import { TripsService } from './services/trips.service';

@Module({
  controllers: [TripsController],
  providers: [TripsService, TripsRepository, TripStateMachine],
  exports: [TripsService],
})
export class TripsModule {}
