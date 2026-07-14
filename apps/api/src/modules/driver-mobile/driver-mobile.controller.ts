import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Permissions } from '../../core/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../../core/auth/interfaces/authenticated-user.interface';
import { ConfirmContainerReturnDto } from '../container-returns/dto/confirm-container-return.dto';
import { ConfirmDeliveryDto } from '../delivery/dto/confirm-delivery.dto';
import { ConfirmPickupDto } from '../delivery/dto/confirm-pickup.dto';
import { CreateTrackingPointDto } from '../tracking/dto/create-tracking-point.dto';
import { RecordTripEventDto } from '../trips/dto/record-trip-event.dto';
import { DriverMobileService } from './driver-mobile.service';
import { ReportDriverIncidentDto } from './dto/report-driver-incident.dto';

@ApiTags('Driver mobile')
@Controller('driver-mobile')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('driver:operate')
@ApiBearerAuth()
export class DriverMobileController {
  constructor(private readonly driverMobileService: DriverMobileService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the driver profile linked to current user' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.driverMobileService.getProfile(user);
  }

  @Get('trips')
  @ApiOperation({ summary: 'List trips assigned to current driver' })
  listTrips(@CurrentUser() user: AuthenticatedUser) {
    return this.driverMobileService.listTrips(user);
  }

  @Get('trips/current')
  @ApiOperation({
    summary: 'Get current active trip assigned to current driver',
  })
  getCurrentTrip(@CurrentUser() user: AuthenticatedUser) {
    return this.driverMobileService.getCurrentTrip(user);
  }

  @Get('trips/:tripId')
  @ApiOperation({ summary: 'Get one trip assigned to current driver' })
  getTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.driverMobileService.getTrip(user, tripId);
  }

  @Post('trips/:tripId/events')
  @ApiOperation({ summary: 'Record a driver operational trip milestone' })
  recordTripEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: RecordTripEventDto,
  ) {
    return this.driverMobileService.recordTripEvent(user, tripId, dto);
  }

  @Post('trips/:tripId/advance')
  @ApiOperation({ summary: 'Advance current driver trip to the next status' })
  advanceTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.driverMobileService.advanceTrip(user, tripId);
  }

  @Post('trips/:tripId/pickup')
  @ApiOperation({ summary: 'Confirm pickup for current driver trip' })
  confirmPickup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: ConfirmPickupDto,
  ) {
    return this.driverMobileService.confirmPickup(user, tripId, dto);
  }

  @Post('trips/:tripId/delivery')
  @ApiOperation({ summary: 'Confirm delivery for current driver trip' })
  confirmDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.driverMobileService.confirmDelivery(user, tripId, dto);
  }

  @Post('trips/:tripId/container-return/start')
  @ApiOperation({ summary: 'Start container return after discharge' })
  startContainerReturn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.driverMobileService.startContainerReturn(user, tripId);
  }

  @Post('trips/:tripId/container-return/confirm')
  @ApiOperation({ summary: 'Confirm container return with proof (POD)' })
  confirmContainerReturn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: ConfirmContainerReturnDto,
  ) {
    return this.driverMobileService.confirmContainerReturn(user, tripId, dto);
  }

  @Post('trips/:tripId/incidents')
  @ApiOperation({ summary: 'Report incident for current driver trip' })
  reportIncident(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: ReportDriverIncidentDto,
  ) {
    return this.driverMobileService.reportIncident(user, tripId, dto);
  }

  @Get('trips/:tripId/route')
  @ApiOperation({ summary: 'Map-ready ordered route of the driver own trip' })
  getTripRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.driverMobileService.getTripRoute(user, tripId);
  }

  @Post('trips/:tripId/tracking-points')
  @ApiOperation({ summary: 'Send GPS point for current driver trip' })
  recordTrackingPoint(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateTrackingPointDto,
  ) {
    return this.driverMobileService.recordTrackingPoint(user, tripId, dto);
  }
}
