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
import { CreateTruckDto } from '../dto/create-truck.dto';
import { ListTrucksQueryDto } from '../dto/list-trucks-query.dto';
import { TruckResponseDto } from '../dto/truck-response.dto';
import { UpdateTruckStatusDto } from '../dto/update-truck-status.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TrucksService } from '../services/trucks.service';

@ApiTags('Trucks')
@Controller('trucks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('trucks:manage')
@ApiBearerAuth()
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.trucksService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List trucks with search, status and pagination' })
  @ApiOkResponse({ type: TruckResponseDto, isArray: true })
  findAll(@Query() query: ListTrucksQueryDto) {
    return this.trucksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get truck by id' })
  @ApiOkResponse({ type: TruckResponseDto })
  findOne(@Param('id') id: string) {
    return this.trucksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create truck' })
  @ApiCreatedResponse({ type: TruckResponseDto })
  create(@Body() dto: CreateTruckDto) {
    return this.trucksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update truck' })
  @ApiOkResponse({ type: TruckResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto) {
    return this.trucksService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update truck status' })
  @ApiOkResponse({ type: TruckResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTruckStatusDto) {
    return this.trucksService.updateStatus(id, dto);
  }

  @Patch(':id/available')
  @ApiOperation({ summary: 'Mark truck as available' })
  @ApiOkResponse({ type: TruckResponseDto })
  setAvailable(@Param('id') id: string) {
    return this.trucksService.setAvailable(id);
  }

  @Patch(':id/maintenance')
  @ApiOperation({ summary: 'Mark truck as maintenance' })
  @ApiOkResponse({ type: TruckResponseDto })
  setMaintenance(@Param('id') id: string) {
    return this.trucksService.setMaintenance(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate truck' })
  @ApiOkResponse({ type: TruckResponseDto })
  deactivate(@Param('id') id: string) {
    return this.trucksService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete truck' })
  @ApiOkResponse({ type: TruckResponseDto })
  remove(@Param('id') id: string) {
    return this.trucksService.remove(id);
  }
}
