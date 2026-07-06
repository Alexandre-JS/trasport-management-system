import { Module } from '@nestjs/common';
import { ClientsController } from './controller/clients.controller';
import { ClientsRepository } from './repository/clients.repository';
import { ClientsService } from './services/clients.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository],
})
export class ClientsModule {}
