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
import { CreateTrailerDto } from '../dto/create-trailer.dto';
import { ListTrailersQueryDto } from '../dto/list-trailers-query.dto';
import { TrailerResponseDto } from '../dto/trailer-response.dto';
import { UpdateTrailerStatusDto } from '../dto/update-trailer-status.dto';
import { UpdateTrailerDto } from '../dto/update-trailer.dto';
import { TrailersService } from '../services/trailers.service';

@ApiTags('Trailers')
@Controller('trailers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('trucks:manage')
@ApiBearerAuth()
export class TrailersController {
  constructor(private readonly trailersService: TrailersService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.trailersService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List trailers with search, status and pagination' })
  @ApiOkResponse({ type: TrailerResponseDto, isArray: true })
  findAll(@Query() query: ListTrailersQueryDto) {
    return this.trailersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trailer by id' })
  @ApiOkResponse({ type: TrailerResponseDto })
  findOne(@Param('id') id: string) {
    return this.trailersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create trailer' })
  @ApiCreatedResponse({ type: TrailerResponseDto })
  create(@Body() dto: CreateTrailerDto) {
    return this.trailersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trailer' })
  @ApiOkResponse({ type: TrailerResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTrailerDto) {
    return this.trailersService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update trailer status' })
  @ApiOkResponse({ type: TrailerResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTrailerStatusDto) {
    return this.trailersService.updateStatus(id, dto);
  }

  @Patch(':id/available')
  @ApiOperation({ summary: 'Mark trailer as available' })
  @ApiOkResponse({ type: TrailerResponseDto })
  setAvailable(@Param('id') id: string) {
    return this.trailersService.setAvailable(id);
  }

  @Patch(':id/maintenance')
  @ApiOperation({ summary: 'Mark trailer as maintenance' })
  @ApiOkResponse({ type: TrailerResponseDto })
  setMaintenance(@Param('id') id: string) {
    return this.trailersService.setMaintenance(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate trailer' })
  @ApiOkResponse({ type: TrailerResponseDto })
  deactivate(@Param('id') id: string) {
    return this.trailersService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete trailer' })
  @ApiOkResponse({ type: TrailerResponseDto })
  remove(@Param('id') id: string) {
    return this.trailersService.remove(id);
  }
}
