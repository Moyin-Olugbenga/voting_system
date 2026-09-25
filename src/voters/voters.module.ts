// src/voters/voters.module.ts
import { Module } from '@nestjs/common';
import { VotersService } from './voters.service';
import { VotersController } from './voters.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [VotersController],
  providers: [VotersService],
})
export class VotersModule {}