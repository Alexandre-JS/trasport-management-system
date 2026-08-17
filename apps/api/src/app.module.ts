import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/throttling/app-throttler.guard';
import appConfig from './config/app.config';
import { AppController } from './app.controller';
import { AppRootController } from './app-root.controller';
import { AuthCoreModule } from './core/auth/auth-core.module';
import { DatabaseModule } from './core/database/database.module';
import { EventsModule } from './core/events/events.module';
import { GpsModule } from './core/gps/gps.module';
import { LoggerModule } from './core/logger/logger.module';
import { NotificationsCoreModule } from './core/notifications/notifications-core.module';
import { SharedModule } from './core/shared/shared.module';
import { TrackingCoreModule } from './core/tracking/tracking-core.module';
import { AuthModule } from './modules/auth/auth.module';
import { BordersModule } from './modules/borders/borders.module';
import { CargoModule } from './modules/cargo/cargo.module';
import { ContainerReturnsModule } from './modules/container-returns/container-returns.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { DriverMobileModule } from './modules/driver-mobile/driver-mobile.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PortalModule } from './modules/portal/portal.module';
import { PublicTrackingModule } from './modules/public-tracking/public-tracking.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { TrailersModule } from './modules/trailers/trailers.module';
import { TripsModule } from './modules/trips/trips.module';
import { TrucksModule } from './modules/trucks/trucks.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        // This bucket is per authenticated session (not per office/proxy IP).
        // It leaves enough headroom for data-heavy screens and reconnects.
        limit: 300,
      },
    ]),
    LoggerModule,
    DatabaseModule,
    AuthCoreModule,
    EventsModule,
    GpsModule,
    NotificationsCoreModule,
    SharedModule,
    TrackingCoreModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    DriversModule,
    TrucksModule,
    TrailersModule,
    BordersModule,
    CargoModule,
    ContainerReturnsModule,
    TripsModule,
    TrackingModule,
    IncidentsModule,
    DeliveryModule,
    DriverMobileModule,
    NotificationsModule,
    DashboardModule,
    PortalModule,
    PublicTrackingModule,
  ],
  controllers: [AppController, AppRootController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
