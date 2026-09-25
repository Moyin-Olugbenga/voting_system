// src/elections/elections.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionStatus } from '@prisma/client';
import { AddEligibilityDto, CreateElectionDto } from './elections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createElection(@Body() dto: CreateElectionDto) {
    return this.electionsService.createElection(dto);
  }

  @Get(':electionId/candidates')
  async getCandidates(@Param('electionId') electionId: string) {
    return this.electionsService.getCandidates(electionId);
  }

  @Post(':electionId/eligibility')
  @UseGuards(JwtAuthGuard)
  async addEligibleVoters(
    @Param('electionId') electionId: string,
    @Body() dto: AddEligibilityDto,
  ) {
    return this.electionsService.addEligibleVoters(electionId, dto);
  }

  @Patch(':electionId/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('electionId') electionId: string,
    @Body('status') status: ElectionStatus,
  ) {
    return this.electionsService.updateStatus(electionId, status);
  }
}