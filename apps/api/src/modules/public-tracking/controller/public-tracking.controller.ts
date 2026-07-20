import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { PublicTrackingService } from '../services/public-tracking.service';

@ApiTags('Public tracking')
@Controller('public')
export class PublicTrackingController {
  constructor(private readonly publicTrackingService: PublicTrackingService) {}

  @Get('track/:token')
  @Public()
  @ApiOperation({
    summary: 'Public, no-login shipment tracking by opaque token',
  })
  track(@Param('token') token: string) {
    return this.publicTrackingService.track(token);
  }

  @Get('client/:token')
  @Public()
  @ApiOperation({
    summary: 'Public, no-login tracking of all a client shipments by token',
  })
  trackClient(@Param('token') token: string) {
    return this.publicTrackingService.trackClient(token);
  }
}
