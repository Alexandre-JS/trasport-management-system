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
import { ClientHistoryResponseDto } from '../dto/client-history-response.dto';
import { ClientResponseDto } from '../dto/client-response.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientsService } from '../services/clients.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('clients:manage')
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.clientsService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List clients with search, filters and pagination' })
  @ApiOkResponse({ type: ClientResponseDto, isArray: true })
  findAll(@Query() query: ListClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by id' })
  @ApiOkResponse({ type: ClientResponseDto })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get client cargo and trip history' })
  @ApiOkResponse({ type: ClientHistoryResponseDto })
  history(@Param('id') id: string) {
    return this.clientsService.history(id);
  }

  @Get(':id/share-token')
  @ApiOperation({ summary: 'Get the client public share token' })
  shareToken(@Param('id') id: string) {
    return this.clientsService.shareToken(id);
  }

  @Post(':id/share-token/regenerate')
  @ApiOperation({
    summary: 'Regenerate the client public share token (revokes the old link)',
  })
  regenerateShareToken(@Param('id') id: string) {
    return this.clientsService.regenerateShareToken(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create client' })
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiOkResponse({ type: ClientResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate client' })
  @ApiOkResponse({ type: ClientResponseDto })
  activate(@Param('id') id: string) {
    return this.clientsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate client' })
  @ApiOkResponse({ type: ClientResponseDto })
  deactivate(@Param('id') id: string) {
    return this.clientsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete client' })
  @ApiOkResponse({ type: ClientResponseDto })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
