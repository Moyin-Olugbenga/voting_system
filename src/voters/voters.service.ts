// src/voters/voters.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterVoterDto } from './dto';
import { Voter } from '@prisma/client';

@Injectable()
export class VotersService {
  constructor(private readonly prisma: PrismaService) {}

  async registerVoter(dto: RegisterVoterDto) {
    // 1. Verify that the device exists and is active
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device || !device.isActive) {
      throw new NotFoundException('Device not found or is inactive');
    }

    // 2. Check if the voter ID already exists
    const existingVoter = await this.prisma.voter.findUnique({
      where: { id: dto.voterId },
    });

    if (existingVoter) {
      throw new ConflictException(`Voter with ID ${dto.voterId} is already registered`);
    }

    // 3. Check if the fingerprint reference already exists on this specific device
    const existingFingerprint = await this.prisma.voter.findUnique({
      where: {
        deviceId_fingerprintId: {
          deviceId: dto.deviceId,
          fingerprintId: dto.fingerprintId,
        },
      },
    });

    if (existingFingerprint) {
      throw new ConflictException(
        `Fingerprint ID ${dto.fingerprintId} is already registered on this device`,
      );
    }

    // 4. Create the voter record
    const voter: Voter = await this.prisma.voter.create({
      data: {
        id: dto.voterId,
        name: dto.name,
        fingerprintId: dto.fingerprintId,
        deviceId: dto.deviceId,
      },
    });

    return {
      success: true,
      message: 'Voter registered successfully',
      voter: {
        id: voter.id,
        name: voter.name,
        fingerprintId: voter.fingerprintId,
        deviceId: voter.deviceId,
      },
    };
  }
}