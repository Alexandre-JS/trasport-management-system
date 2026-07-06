import { Module } from '@nestjs/common';
import { PublicTrackingController } from './controller/public-tracking.controller';
import { PublicTrackingRepository } from './repository/public-tracking.repository';
import { PublicTrackingService } from './services/public-tracking.service';

@Module({
  controllers: [PublicTrackingController],
  providers: [PublicTrackingService, PublicTrackingRepository],
})
export class PublicTrackingModule {}
