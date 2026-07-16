import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Permissions } from '../../../core/auth/decorators/permissions.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../core/auth/interfaces/authenticated-user.interface';
import { AssignCargoDto } from '../dto/assign-cargo.dto';
import { AssignDriverDto } from '../dto/assign-driver.dto';
import { AssignTrailerDto } from '../dto/assign-trailer.dto';
import { AssignTruckDto } from '../dto/assign-truck.dto';
import { CreateTripDto } from '../dto/create-trip.dto';
import { ListTripsQueryDto } from '../dto/list-trips-query.dto';
import { RecordTripEventDto } from '../dto/record-trip-event.dto';
import { TripResponseDto } from '../dto/trip-response.dto';
import { UpdateTripStatusDto } from '../dto/update-trip-status.dto';
import { UpdateTripDto } from '../dto/update-trip.dto';
import { TripsService } from '../services/trips.service';

@ApiTags('Trips')
@Controller('trips')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('trips:manage')
@ApiBearerAuth()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.tripsService.health();
  }

  @Get('activities')
  @ApiOperation({
    summary: 'List activity sheets: trips grouped by client + route + day',
  })
  listActivities() {
    return this.tripsService.listActivities();
  }

  @Get('resources-in-use')
  @ApiOperation({
    summary: 'Horse/trailer plates and driver licenses on active trips',
  })
  listResourcesInUse() {
    return this.tripsService.listResourcesInUse();
  }

  @Get()
  @ApiOperation({ summary: 'List trips with search, filters and pagination' })
  @ApiOkResponse({ type: TripResponseDto, isArray: true })
  findAll(@Query() query: ListTripsQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip by id' })
  @ApiOkResponse({ type: TripResponseDto })
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create trip' })
  @ApiCreatedResponse({ type: TripResponseDto })
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trip' })
  @ApiOkResponse({ type: TripResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update trip status' })
  @ApiOkResponse({ type: TripResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTripStatusDto) {
    return this.tripsService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel trip' })
  @ApiOkResponse({ type: TripResponseDto })
  cancel(@Param('id') id: string) {
    return this.tripsService.cancel(id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close trip' })
  @ApiOkResponse({ type: TripResponseDto })
  close(@Param('id') id: string) {
    return this.tripsService.close(id);
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Assign driver to trip' })
  @ApiOkResponse({ type: TripResponseDto })
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.tripsService.assignDriver(id, dto);
  }

  @Patch(':id/assign-truck')
  @ApiOperation({ summary: 'Assign truck to trip' })
  @ApiOkResponse({ type: TripResponseDto })
  assignTruck(@Param('id') id: string, @Body() dto: AssignTruckDto) {
    return this.tripsService.assignTruck(id, dto);
  }

  @Patch(':id/assign-trailer')
  @ApiOperation({ summary: 'Assign trailer to trip' })
  @ApiOkResponse({ type: TripResponseDto })
  assignTrailer(@Param('id') id: string, @Body() dto: AssignTrailerDto) {
    return this.tripsService.assignTrailer(id, dto);
  }

  @Patch(':id/assign-cargo')
  @ApiOperation({ summary: 'Assign cargo to trip' })
  @ApiOkResponse({ type: TripResponseDto })
  assignCargo(@Param('id') id: string, @Body() dto: AssignCargoDto) {
    return this.tripsService.assignCargo(id, dto);
  }

  @Post(':id/events')
  @ApiOperation({
    summary: 'Record a trip milestone (drives the matching status transition)',
  })
  @ApiCreatedResponse({ type: TripResponseDto })
  recordEvent(
    @Param('id') id: string,
    @Body() dto: RecordTripEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tripsService.recordEvent(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete trip (cancels and releases resources)',
  })
  @ApiOkResponse({ type: TripResponseDto })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.remove(id, user.id);
  }
}
