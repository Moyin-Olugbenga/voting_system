// src/voting/dto/verify-voter.dto.ts
import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class VerifyVoterDto {
  @IsString()
  @IsNotEmpty()
  electionId!: string;

  @IsInt()
  @Min(1)
  fingerprintId!: number;

  @IsString()
  @IsNotEmpty()
  deviceId!: string; // Identifies the scanning hardware terminal
}

export class SubmitVoteDto {
  @IsString()
  @IsNotEmpty()
  electionId!: string;

  @IsInt()
  @Min(1)
  candidateId!: number;

  @IsString()
  @IsNotEmpty()
  votingSession!: string; // Temporary secure token issued during verification

  @IsString()
  @IsNotEmpty()
  requestId!: string; // Unique request ID from client to ensure idempotency
}