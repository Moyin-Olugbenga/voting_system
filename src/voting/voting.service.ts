// src/voting/voting.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ElectionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { SubmitVoteDto, VerifyVoterDto } from './voting.dto';

@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyVoter(dto: VerifyVoterDto) {
    // 1. Validate Election Status
    const election = await this.prisma.election.findUnique({
      where: { id: dto.electionId },
    });

    if (!election) {
      throw new NotFoundException({
        success: false,
        code: 'ELECTION_NOT_FOUND',
        message: 'The specified election does not exist.',
      });
    }

    if (election.status !== ElectionStatus.ACTIVE) {
      throw new BadRequestException({
        success: false,
        code: 'ELECTION_NOT_ACTIVE',
        message: 'This election is not currently active for voting.',
      });
    }

    // 2. Identify voter via fingerprint ID and device ID scope
    const voter = await this.prisma.voter.findUnique({
      where: {
        deviceId_fingerprintId: {
          deviceId: dto.deviceId,
          fingerprintId: dto.fingerprintId,
        },
      },
    });

    if (!voter) {
      throw new NotFoundException({
        success: false,
        code: 'VOTER_NOT_FOUND',
        message: 'No registered voter found matching this fingerprint on this device.',
      });
    }

    // 3. Confirm voter eligibility for this election
    const eligibility = await this.prisma.voterEligibility.findUnique({
      where: {
        electionId_voterId: {
          electionId: dto.electionId,
          voterId: voter.id,
        },
      },
    });

    if (!eligibility) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_ELIGIBLE',
        message: 'Voter is not authorized to participate in this election.',
      });
    }

    // 4. Check if the voter has already voted in this election
    const participation = await this.prisma.voterParticipation.findUnique({
      where: {
        electionId_voterId: {
          electionId: dto.electionId,
          voterId: voter.id,
        },
      },
    });

    if (participation) {
      throw new ConflictException({
        success: false,
        code: 'ALREADY_VOTED',
        message: 'Voter has already cast a ballot in this election.',
      });
    }

    // 5. Generate a temporary secure voting session token (valid for 120 seconds)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresInSeconds = 120;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await this.prisma.votingSession.create({
      data: {
        electionId: dto.electionId,
        voterId: voter.id,
        token: sessionToken,
        expiresAt,
        isUsed: false,
      },
    });

    return {
      success: true,
      eligible: true,
      votingSession: sessionToken,
      expiresIn: expiresInSeconds,
      voterId: voter.id, // helpful for internal session tracking on ESP32 if required
    };
  }

  async submitVote(dto: SubmitVoteDto) {
    // 1. Find and validate the temporary voting session
    const session = await this.prisma.votingSession.findUnique({
      where: { token: dto.votingSession },
      include: { voter: true },
    });

    if (!session || session.electionId !== dto.electionId) {
      throw new BadRequestException({
        success: false,
        code: 'INVALID_SESSION',
        message: 'The voting session token is invalid or does not match this election.',
      });
    }

    if (session.isUsed) {
      throw new BadRequestException({
        success: false,
        code: 'SESSION_ALREADY_USED',
        message: 'This voting session token has already been consumed.',
      });
    }

    if (new Date() > session.expiresAt) {
      throw new BadRequestException({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'The voting session has expired. Please rescan your fingerprint.',
      });
    }

    // 2. Validate that the candidate belongs to this election
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id: dto.candidateId,
        electionId: dto.electionId,
      },
    });

    if (!candidate) {
      throw new NotFoundException({
        success: false,
        code: 'CANDIDATE_NOT_FOUND',
        message: 'Selected candidate does not exist in this election.',
      });
    }

    // 3. Execute atomic transaction to prevent double voting and record vote securely
    try {
      const receiptId = `RCP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      await this.prisma.$transaction(async (tx) => {
        // Mark session as used immediately
        await tx.votingSession.update({
          where: { id: session.id },
          data: { isUsed: true },
        });

        // Create voter participation record (enforces unique voter/election constraint)
        await tx.voterParticipation.create({
          data: {
            electionId: dto.electionId,
            voterId: session.voterId,
          },
        });

        // Record the separate, anonymous ballot choice
        await tx.ballot.create({
          data: {
            electionId: dto.electionId,
            candidateId: dto.candidateId,
          },
        });
      });

      return {
        success: true,
        message: 'Vote recorded successfully',
        receiptId,
      };
    } catch (error: any) {
      // Handle unique constraint violation for duplicate participation atomically
      if (error.code === 'P2002') {
        throw new ConflictException({
          success: false,
          code: 'ALREADY_VOTED',
          message: 'A vote has already been recorded for this voter in this election.',
        });
      }
      throw error;
    }
  }
}