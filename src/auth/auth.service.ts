// src/auth/auth.service.ts
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterVoterDto } from '../voters/dto';
// import { Admin } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      accessToken,
      role: admin.role,
    };
  }
  // src/voters/voters.service.ts
  async registerVoter(dto: RegisterVoterDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device || !device.isActive) {
      throw new NotFoundException('Device not found or is inactive');
    }

    if (await this.prisma.voter.findUnique({ where: { id: dto.voterId } })) {
      throw new ConflictException(`Voter with ID ${dto.voterId} is already registered`);
    }

    if (
      await this.prisma.voter.findUnique({
        where: {
          deviceId_fingerprintId: {
            deviceId: dto.deviceId,
            fingerprintId: dto.fingerprintId,
          },
        },
      })
    ) {
      throw new ConflictException(
        `Fingerprint ID ${dto.fingerprintId} is already registered on this device`,
      );
    }

    const voter = await this.prisma.voter.create({
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
