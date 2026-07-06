import {
  Body,
  Controller,
  Get,
  Param,
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
import { Permissions } from '../../../core/auth/decorators/permissions.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { CreateTrackingPointDto } from '../dto/create-tracking-point.dto';
import { ListTrackingQueryDto } from '../dto/list-tracking-query.dto';
import { TrackingPointResponseDto } from '../dto/tracking-point-response.dto';
import { TripRouteResponseDto } from '../dto/trip-route-response.dto';
import { TrackingService } from '../services/tracking.service';

@ApiTags('Tracking')
@Controller('tracking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('tracking:manage')
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.trackingService.health();
  }

  @Post('trips/:tripId/points')
  @ApiOperation({ summary: 'Receive a GPS point for a trip and broadcast it' })
  @ApiCreatedResponse({ type: TrackingPointResponseDto })
  recordPoint(
    @Param('tripId') tripId: string,
    @Body() dto: CreateTrackingPointDto,
  ) {
    return this.trackingService.recordPoint(tripId, dto);
  }

  @Get('trips/:tripId/last')
  @ApiOperation({ summary: 'Get the last known location of a trip' })
  @ApiOkResponse({ type: TrackingPointResponseDto })
  getLast(@Param('tripId') tripId: string) {
    return this.trackingService.getLastLocation(tripId);
  }

  @Get('trips/:tripId/history')
  @ApiOperation({ summary: 'Get paginated GPS history of a trip' })
  @ApiOkResponse({ type: TrackingPointResponseDto, isArray: true })
  getHistory(
    @Param('tripId') tripId: string,
    @Query() query: ListTrackingQueryDto,
  ) {
    return this.trackingService.getHistory(tripId, query);
  }

  @Get('trips/:tripId/route')
  @ApiOperation({ summary: 'Get map-ready ordered route of a trip' })
  @ApiOkResponse({ type: TripRouteResponseDto })
  getRoute(@Param('tripId') tripId: string) {
    return this.trackingService.getRoute(tripId);
  }
}
