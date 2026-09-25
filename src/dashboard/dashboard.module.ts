// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}