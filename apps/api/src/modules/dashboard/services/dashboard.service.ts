import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repository/dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  health() {
    return this.dashboardRepository.health();
  }
}
