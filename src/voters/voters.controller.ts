// src/voters/voters.controller.ts
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { VotersService } from './voters.service';
import { RegisterVoterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/voters')
@UseGuards(JwtAuthGuard) // Requires admin session token
export class VotersController {
  constructor(private readonly votersService: VotersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterVoterDto) {
    return this.votersService.registerVoter(dto);
  }
}