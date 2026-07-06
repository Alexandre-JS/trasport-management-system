import { Global, Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { NotificationDispatcherService } from './notification-dispatcher.service';

@Global()
@Module({
  imports: [EventsModule],
  providers: [NotificationDispatcherService],
  exports: [NotificationDispatcherService],
})
export class NotificationsCoreModule {}
