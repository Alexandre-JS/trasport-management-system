import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Permissions } from '../../../core/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../core/auth/interfaces/authenticated-user.interface';
import { ConfirmContainerReturnDto } from '../dto/confirm-container-return.dto';
import { ContainerReturnService } from '../services/container-return.service';

@ApiTags('Container returns')
@Controller('container-returns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('trips:manage')
@ApiBearerAuth()
export class ContainerReturnController {
  constructor(private readonly service: ContainerReturnService) {}

  @Get(':tripId')
  @ApiOperation({ summary: 'Get the container return of a trip' })
  get(@Param('tripId') tripId: string) {
    return this.service.get(tripId);
  }

  @Post(':tripId/start')
  @ApiOperation({ summary: 'Start the container return of a discharged trip' })
  start(
    @Param('tripId') tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.start(tripId, user.id);
  }

  @Post(':tripId/confirm')
  @ApiOperation({ summary: 'Confirm container return with proof (POD)' })
  confirm(
    @Param('tripId') tripId: string,
    @Body() dto: ConfirmContainerReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.confirm(tripId, dto, user.id);
  }
}
