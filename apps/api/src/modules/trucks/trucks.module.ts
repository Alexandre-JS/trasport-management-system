import { Module } from '@nestjs/common';
import { TrucksController } from './controller/trucks.controller';
import { TrucksRepository } from './repository/trucks.repository';
import { TrucksService } from './services/trucks.service';

@Module({
  controllers: [TrucksController],
  providers: [TrucksService, TrucksRepository],
})
export class TrucksModule {}
