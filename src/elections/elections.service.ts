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
}