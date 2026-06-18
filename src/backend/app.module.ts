import { Module } from '@nestjs/common';
import { HealthController } from './api/controllers/HealthController';
import { HealthService } from './application/health/HealthService';
import { AuthModule } from './application/auth/AuthModule';
import { VerificationModule } from './application/verification/VerificationModule';
import { PrismaModule } from './infrastructure/persistence/prisma/PrismaModule';

@Module({
  imports: [PrismaModule, AuthModule, VerificationModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}