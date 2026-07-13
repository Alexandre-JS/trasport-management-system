import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from './version';

@ApiTags('App')
@Controller()
export class AppController {
  @Get('version')
  @ApiOperation({ summary: 'Application name and release version' })
  version() {
    return { name: 'SGRTC API', version: APP_VERSION };
  }
}
