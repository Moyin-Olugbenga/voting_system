// src/voters/voters.controller.ts
import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { VotersService } from './voters.service';
import { RegisterVoterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('voters') // Clean prefix to match global setup
@UseGuards(JwtAuthGuard)
export class VotersController {
  constructor(private readonly votersService: VotersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllVoters() {
    return this.votersService.getAllVoters();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterVoterDto) {
    return this.votersService.registerVoter(dto);
  }
}
