import { Module } from '@nestjs/common';
import { BordersController } from './controller/borders.controller';
import { BordersRepository } from './repository/borders.repository';
import { BordersService } from './services/borders.service';

@Module({
  controllers: [BordersController],
  providers: [BordersService, BordersRepository],
  exports: [BordersRepository],
})
export class BordersModule {}
