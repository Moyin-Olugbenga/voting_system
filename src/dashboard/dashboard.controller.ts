// src/dashboard/dashboard.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getSystemOverview() {
    return this.dashboardService.getSystemOverview();
  }

  @Get('elections/:electionId/results')
  async getElectionResults(@Param('electionId') electionId: string) {
    return this.dashboardService.getElectionResults(electionId);
  }
}