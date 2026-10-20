import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { VotersModule } from './voters/voters.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ElectionsModule } from './elections/electons.module';
import { VotingModule } from './voting/voting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    VotersModule,
    AuthModule,
    DashboardModule,
    ElectionsModule,
    VotingModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
