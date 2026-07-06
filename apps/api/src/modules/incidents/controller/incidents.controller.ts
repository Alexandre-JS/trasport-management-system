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
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { IncidentResponseDto } from '../dto/incident-response.dto';
import { ListIncidentsQueryDto } from '../dto/list-incidents-query.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { IncidentsService } from '../services/incidents.service';

@ApiTags('Incidents')
@Controller('incidents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('incidents:manage')
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.incidentsService.health();
  }

  @Get('types')
  @ApiOperation({ summary: 'List available incident types' })
  getTypes() {
    return this.incidentsService.getTypes();
  }

  @Get()
  @ApiOperation({ summary: 'List incidents with filters and pagination' })
  @ApiOkResponse({ type: IncidentResponseDto, isArray: true })
  findAll(@Query() query: ListIncidentsQueryDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by id' })
  @ApiOkResponse({ type: IncidentResponseDto })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report an incident for a trip' })
  @ApiCreatedResponse({ type: IncidentResponseDto })
  create(@Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident' })
  @ApiOkResponse({ type: IncidentResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Mark incident as resolved' })
  @ApiOkResponse({ type: IncidentResponseDto })
  resolve(@Param('id') id: string) {
    return this.incidentsService.resolve(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete incident' })
  @ApiOkResponse({ type: IncidentResponseDto })
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
