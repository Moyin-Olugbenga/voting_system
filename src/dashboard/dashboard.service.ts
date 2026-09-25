// src/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemOverview() {
    const totalVoters = await this.prisma.voter.count();
    const totalElections = await this.prisma.election.count();
    const activeElections = await this.prisma.election.count({
      where: { status: 'ACTIVE' },
    });
    const totalVotesRecorded = await this.prisma.ballot.count();

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { admin: { select: { username: true, role: true } } },
    });

    return {
      success: true,
      metrics: {
        totalVoters,
        totalElections,
        activeElections,
        totalVotesRecorded,
      },
      recentAuditLogs,
    };
  }

  async getElectionResults(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true },
    });

    if (!election) {
      throw new NotFoundException({
        success: false,
        message: 'Election not found',
      });
    }

    // Calculate candidate vote totals consistently from recorded ballots
    const ballotCounts = await this.prisma.ballot.groupBy({
      by: ['candidateId'],
      where: { electionId },
      _count: {
        id: true,
      },
    });

    // Map votes to respective candidates
    const results = election.candidates.map((candidate) => {
      const match = ballotCounts.find((b) => b.candidateId === candidate.id);
      return {
        candidateId: candidate.id,
        name: candidate.name,
        voteCount: match ? match._count.id : 0,
      };
    });

    // Total votes cast in this specific election
    const totalElectionVotes = results.reduce((sum, curr) => sum + curr.voteCount, 0);

    return {
      success: true,
      electionId: election.id,
      title: election.title,
      status: election.status,
      totalVotes: totalElectionVotes,
      results,
    };
  }
}