// src/voting/voting.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VotingService } from './voting.service';
import { SubmitVoteDto, VerifyVoterDto } from './voting.dto';

@Controller('api/voters')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyVoter(@Body() dto: VerifyVoterDto) {
    return this.votingService.verifyVoter(dto);
  }
  
  @Post('votes')
  @HttpCode(HttpStatus.CREATED)
  async submitVote(@Body() dto: SubmitVoteDto) {
    return this.votingService.submitVote(dto);
  }
}