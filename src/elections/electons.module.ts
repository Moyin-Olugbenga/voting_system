// src/elections/elections.module.ts
import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [ElectionsController],
  providers: [ElectionsService],
})
export class ElectionsModule {}