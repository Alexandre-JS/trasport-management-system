import { Module } from '@nestjs/common';
import { ContainerReturnController } from './controller/container-return.controller';
import { ContainerReturnRepository } from './repository/container-return.repository';
import { ContainerReturnService } from './services/container-return.service';

@Module({
  controllers: [ContainerReturnController],
  providers: [ContainerReturnService, ContainerReturnRepository],
  exports: [ContainerReturnService],
})
export class ContainerReturnsModule {}
