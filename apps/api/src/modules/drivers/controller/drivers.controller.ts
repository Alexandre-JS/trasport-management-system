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
import { Permissions } from '../../../core/auth/decorators/permissions.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverHistoryResponseDto } from '../dto/driver-history-response.dto';
import { DriverResponseDto } from '../dto/driver-response.dto';
import { ListDriversQueryDto } from '../dto/list-drivers-query.dto';
import { UpdateDriverStatusDto } from '../dto/update-driver-status.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { DriversService } from '../services/drivers.service';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('drivers:manage')
@ApiBearerAuth()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.driversService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List drivers with search, status and pagination' })
  @ApiOkResponse({ type: DriverResponseDto, isArray: true })
  findAll(@Query() query: ListDriversQueryDto) {
    return this.driversService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by id' })
  @ApiOkResponse({ type: DriverResponseDto })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get driver trip history' })
  @ApiOkResponse({ type: DriverHistoryResponseDto })
  history(@Param('id') id: string) {
    return this.driversService.history(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create driver' })
  @ApiCreatedResponse({ type: DriverResponseDto })
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver' })
  @ApiOkResponse({ type: DriverResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update driver status' })
  @ApiOkResponse({ type: DriverResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDriverStatusDto) {
    return this.driversService.updateStatus(id, dto);
  }

  @Patch(':id/available')
  @ApiOperation({ summary: 'Mark driver as available' })
  @ApiOkResponse({ type: DriverResponseDto })
  setAvailable(@Param('id') id: string) {
    return this.driversService.setAvailable(id);
  }

  @Patch(':id/offline')
  @ApiOperation({ summary: 'Mark driver as offline' })
  @ApiOkResponse({ type: DriverResponseDto })
  setOffline(@Param('id') id: string) {
    return this.driversService.setOffline(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate driver' })
  @ApiOkResponse({ type: DriverResponseDto })
  deactivate(@Param('id') id: string) {
    return this.driversService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete driver' })
  @ApiOkResponse({ type: DriverResponseDto })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}
