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
import { CargoResponseDto } from '../dto/cargo-response.dto';
import { CreateCargoDto } from '../dto/create-cargo.dto';
import { ListCargoQueryDto } from '../dto/list-cargo-query.dto';
import { UpdateCargoStatusDto } from '../dto/update-cargo-status.dto';
import { UpdateCargoDto } from '../dto/update-cargo.dto';
import { CargoService } from '../services/cargo.service';

@ApiTags('Cargo')
@Controller('cargo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('cargo:manage')
@ApiBearerAuth()
export class CargoController {
  constructor(private readonly cargoService: CargoService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.cargoService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List cargo with search, filters and pagination' })
  @ApiOkResponse({ type: CargoResponseDto, isArray: true })
  findAll(@Query() query: ListCargoQueryDto) {
    return this.cargoService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cargo by id' })
  @ApiOkResponse({ type: CargoResponseDto })
  findOne(@Param('id') id: string) {
    return this.cargoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create cargo with automatic code' })
  @ApiCreatedResponse({ type: CargoResponseDto })
  create(@Body() dto: CreateCargoDto) {
    return this.cargoService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cargo' })
  @ApiOkResponse({ type: CargoResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCargoDto) {
    return this.cargoService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update cargo status' })
  @ApiOkResponse({ type: CargoResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCargoStatusDto) {
    return this.cargoService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel cargo' })
  @ApiOkResponse({ type: CargoResponseDto })
  cancel(@Param('id') id: string) {
    return this.cargoService.cancel(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete cargo' })
  @ApiOkResponse({ type: CargoResponseDto })
  remove(@Param('id') id: string) {
    return this.cargoService.remove(id);
  }
}
