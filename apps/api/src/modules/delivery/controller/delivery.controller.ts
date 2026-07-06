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
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { ConfirmPickupDto } from '../dto/confirm-pickup.dto';
import { DeliveryResponseDto } from '../dto/delivery-response.dto';
import { ListDeliveriesQueryDto } from '../dto/list-deliveries-query.dto';
import { DeliveryService } from '../services/delivery.service';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('delivery:manage')
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.deliveryService.health();
  }

  @Post('trips/:tripId/pickup')
  @ApiOperation({ summary: 'Confirm cargo pickup for a trip' })
  recordPickup(@Param('tripId') tripId: string, @Body() dto: ConfirmPickupDto) {
    return this.deliveryService.confirmPickup(tripId, dto);
  }

  @Post('trips/:tripId/confirm')
  @ApiOperation({
    summary: 'Confirm delivery with photo, signature and observations',
  })
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  confirmDelivery(
    @Param('tripId') tripId: string,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.deliveryService.confirmDelivery(tripId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deliveries with filters and pagination' })
  @ApiOkResponse({ type: DeliveryResponseDto, isArray: true })
  findAll(@Query() query: ListDeliveriesQueryDto) {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by id' })
  @ApiOkResponse({ type: DeliveryResponseDto })
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }
}
