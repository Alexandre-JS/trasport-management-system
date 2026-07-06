import { Module } from '@nestjs/common';
import { TrailersController } from './controller/trailers.controller';
import { TrailersRepository } from './repository/trailers.repository';
import { TrailersService } from './services/trailers.service';

@Module({
  controllers: [TrailersController],
  providers: [TrailersService, TrailersRepository],
})
export class TrailersModule {}
