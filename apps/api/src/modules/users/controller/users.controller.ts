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
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';
import { CreateClientAccountDto } from '../dto/create-client-account.dto';
import { CreateDriverAccountDto } from '../dto/create-driver-account.dto';
import { ProvisionDriverAccessDto } from '../dto/provision-driver-access.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('users:manage')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  @Public()
  @Permissions()
  health() {
    return this.usersService.health();
  }

  @Get()
  @ApiOperation({ summary: 'List users with search, filters and pagination' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List assignable roles' })
  listRoles() {
    return this.usersService.listRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('client-accounts')
  @ApiOperation({ summary: 'Provision a portal login for a client' })
  @ApiCreatedResponse({ type: UserResponseDto })
  createClientAccount(@Body() dto: CreateClientAccountDto) {
    return this.usersService.createClientAccount(dto);
  }

  @Post('drivers')
  @ApiOperation({
    summary:
      'Create a driver user + driver record with a generated mobile access code',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  createDriverAccount(@Body() dto: CreateDriverAccountDto) {
    return this.usersService.createDriverAccount(dto);
  }

  @Post('drivers/:driverId/access')
  @ApiOperation({
    summary: 'Provision mobile access for an existing operational driver',
  })
  provisionDriverAccess(
    @Param('driverId') driverId: string,
    @Body() dto: ProvisionDriverAccessDto,
  ) {
    return this.usersService.provisionDriverAccess(driverId, dto);
  }

  @Post(':id/access-code')
  @ApiOperation({ summary: 'Regenerate a driver mobile access code' })
  regenerateAccessCode(@Param('id') id: string) {
    return this.usersService.regenerateAccessCode(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate user' })
  @ApiOkResponse({ type: UserResponseDto })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiOkResponse({ type: UserResponseDto })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/password/reset')
  @ApiOperation({ summary: 'Reset user password' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role/profile' })
  @ApiOkResponse({ type: UserResponseDto })
  changeRole(@Param('id') id: string, @Body() dto: ChangeUserRoleDto) {
    return this.usersService.changeRole(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiOkResponse({ type: UserResponseDto })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
