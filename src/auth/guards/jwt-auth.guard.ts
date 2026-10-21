// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path if needed based on your folder structure

@Injectable()
export class JwtAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Check for Device Key authentication first (for ESP32 hardware terminals)
    const deviceKey = request.headers['x-device-key'];
    if (deviceKey) {
      const device = await this.prisma.device.findUnique({
        where: { deviceKey: String(deviceKey) },
      });

      if (!device || !device.isActive) {
        throw new UnauthorizedException('Invalid or inactive device key');
      }

      request.device = device; // Attach device info to request
      return true;
    }

    // 2. Fall back to JWT authentication (for Admin Dashboard users)
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token or device key');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secure-voting-secret',
      });
      request.user = payload; // Attach admin payload to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}