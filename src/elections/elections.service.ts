// src/elections/elections.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ElectionStatus } from '@prisma/client';
import { AddEligibilityDto, CreateElectionDto } from './elections.dto';

@Injectable()
export class ElectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createElection(dto: CreateElectionDto) {
    const election = await this.prisma.election.create({
      data: {
        title: dto.title,
        status: ElectionStatus.DRAFT,
        candidates: {
          create: dto.candidates.map((c) => ({ name: c.name })),
        },
      },
      include: {
        candidates: true,
      },
    });

    return {
      success: true,
      message: 'Election created successfully',
      election,
    };
  }

    async getElections() {
    const elections = await this.prisma.election.findMany();

    return {
      success: true,
      message: 'Election gotten successfully',
      elections,
    };
  }


  async getCandidates(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    return {
      success: true,
      candidates: election.candidates,
    };
  }

  async addEligibleVoters(electionId: string, dto: AddEligibilityDto) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    if (election.status !== ElectionStatus.DRAFT) {
      throw new BadRequestException('Can only modify voter eligibility while election is in DRAFT state');
    }

    // Upsert or create eligibility records securely
    const operations = dto.voterIds.map((voterId) =>
      this.prisma.voterEligibility.upsert({
        where: { electionId_voterId: { electionId, voterId } },
        update: {},
        create: { electionId, voterId },
      }),
    );

    await this.prisma.$transaction(operations);

    return {
      success: true,
      message: 'Voter eligibility updated successfully',
    };
  }

  async updateStatus(electionId: string, targetStatus: ElectionStatus) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true, eligibility: true },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Validation before activating/readying
    if (targetStatus === ElectionStatus.ACTIVE || targetStatus === ElectionStatus.READY) {
      if (election.candidates.length === 0) {
        throw new BadRequestException('Cannot activate an election with no candidates');
      }
      if (election.eligibility.length === 0) {
        throw new BadRequestException('Cannot activate an election with no eligible voters assigned');
      }
    }

    const updated = await this.prisma.election.update({
      where: { id: electionId },
      data: { status: targetStatus },
    });

    return {
      success: true,
      message: `Election status updated to ${targetStatus}`,
      election: updated,
    };
  }

async getElectionResults(electionId: string) {
  const election = await this.prisma.election.findUnique({
    where: { id: electionId },
    include: {
      candidates: true,
      eligibility: true,
      ballots: true,
    },
  });

  if (!election) {
    throw new NotFoundException('Election not found');
  }

  // Count votes per candidate
  const results = election.candidates.map((candidate) => {
    const voteCount = election.ballots.filter((b) => b.candidateId === candidate.id).length;
    return {
      candidateId: candidate.id,
      name: candidate.name,
      voteCount,
    };
  });

  // Sort candidates by vote count descending to find the winner
  results.sort((a, b) => b.voteCount - a.voteCount);
  
  const totalVotes = election.ballots.length;
  const totalEligible = election.eligibility.length;
  const turnoutPercentage = totalEligible > 0 ? ((totalVotes / totalEligible) * 100).toFixed(1) : '0';

  // Determine winner if election is closed or active
  let winner;
  if (results.length > 0 && results[0].voteCount > 0) {
    // Check for a tie
    if (results.length > 1 && results[0].voteCount === results[1].voteCount) {
      winner = { name: 'It is a tie!', voteCount: results[0].voteCount };
    } else {
      winner = results[0];
    }
  }

  return {
    success: true,
    title: election.title,
    status: election.status,
    totalVotes,
    totalEligible,
    turnoutPercentage,
    winner,
    results,
  };
}

async getElectionBallots(electionId: string) {
  const ballots = await this.prisma.ballot.findMany({
    where: { electionId },
    include: {
      candidate: true,
    },
    orderBy: { castAt: 'desc' },
  });

  // Map to a clean audit log structure preserving ballot anonymity
  const formattedBallots = ballots.map((b, index) => ({
    ballotNo: ballots.length - index, // Generates sequential anonymous receipt numbers
    candidateName: b.candidate.name,
    castAt: b.castAt,
  }));

  return {
    success: true,
    ballots: formattedBallots,
  };
}


  
}
