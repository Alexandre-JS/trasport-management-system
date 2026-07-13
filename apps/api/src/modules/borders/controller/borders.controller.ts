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
import { BorderResponseDto } from '../dto/border-response.dto';
import { CreateBorderDto } from '../dto/create-border.dto';
import { ListBordersQueryDto } from '../dto/list-borders-query.dto';
import { UpdateBorderDto } from '../dto/update-border.dto';
import { BordersService } from '../services/borders.service';

@ApiTags('Borders')
@Controller('borders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('trips:manage')
@ApiBearerAuth()
export class BordersController {
  constructor(private readonly bordersService: BordersService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.bordersService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List borders with search, active and pagination' })
  @ApiOkResponse({ type: BorderResponseDto, isArray: true })
  findAll(@Query() query: ListBordersQueryDto) {
    return this.bordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get border by id' })
  @ApiOkResponse({ type: BorderResponseDto })
  findOne(@Param('id') id: string) {
    return this.bordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create border' })
  @ApiCreatedResponse({ type: BorderResponseDto })
  create(@Body() dto: CreateBorderDto) {
    return this.bordersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update border' })
  @ApiOkResponse({ type: BorderResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateBorderDto) {
    return this.bordersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete border' })
  @ApiOkResponse({ type: BorderResponseDto })
  remove(@Param('id') id: string) {
    return this.bordersService.remove(id);
  }
}
