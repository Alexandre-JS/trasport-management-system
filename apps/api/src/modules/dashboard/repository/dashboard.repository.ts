import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardRepository {
  health() {
    return { module: 'dashboard', status: 'ready' };
  }
}
