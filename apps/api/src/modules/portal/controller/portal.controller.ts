import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Permissions } from '../../../core/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../core/auth/interfaces/authenticated-user.interface';
import { PortalService } from '../services/portal.service';

@ApiTags('Portal')
@Controller('portal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('cargo:read-own')
@ApiBearerAuth()
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('trips')
  @ApiOperation({ summary: "List the authenticated client's shipments" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.listShipments(user.id);
  }

  @Get('trips/:id')
  @ApiOperation({ summary: "Get one of the client's shipments with its history" })
  detail(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getShipment(user.id, id);
  }
}
