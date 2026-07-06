import { Module } from '@nestjs/common';
import { CargoController } from './controller/cargo.controller';
import { CargoRepository } from './repository/cargo.repository';
import { CargoService } from './services/cargo.service';

@Module({
  controllers: [CargoController],
  providers: [CargoService, CargoRepository],
})
export class CargoModule {}
