import { Module } from '@nestjs/common';
import { PortalController } from './controller/portal.controller';
import { PortalRepository } from './repository/portal.repository';
import { PortalService } from './services/portal.service';

@Module({
  controllers: [PortalController],
  providers: [PortalService, PortalRepository],
})
export class PortalModule {}
