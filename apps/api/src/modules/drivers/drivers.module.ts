import { Module } from '@nestjs/common';
import { DriversController } from './controller/drivers.controller';
import { DriversRepository } from './repository/drivers.repository';
import { DriversService } from './services/drivers.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService, DriversRepository],
})
export class DriversModule {}
