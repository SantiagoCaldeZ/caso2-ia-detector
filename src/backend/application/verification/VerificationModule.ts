import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VerificationController } from '../../api/controllers/VerificationController';
import { JwtAuthGuard } from '../../api/guards/JwtAuthGuard';
import { PrismaModule } from '../../infrastructure/persistence/prisma/PrismaModule';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';
import { CreateVerificationCaseService } from './CreateVerificationCaseService';
import { ListVerificationHistoryService } from './ListVerificationHistoryService';
import { GetVerificationCaseService } from './GetVerificationCaseService';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret:
        process.env.JWT_ACCESS_SECRET ??
        'local-development-access-secret-change-me',
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      },
    }),
  ],
  controllers: [VerificationController],
  providers: [
    CreateVerificationCaseService,
    ListVerificationHistoryService,
    GetVerificationCaseService,
    VerificationRepository,
    UserRepository,
    JwtAuthGuard,
  ],
})
export class VerificationModule {}