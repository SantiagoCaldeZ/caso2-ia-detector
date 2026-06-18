import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { VerificationController } from '../../api/controllers/VerificationController';
import { UploadController } from '../../api/controllers/UploadController';
import { JwtAuthGuard } from '../../api/guards/JwtAuthGuard';
import { PrismaModule } from '../../infrastructure/persistence/prisma/PrismaModule';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';
import { CreateVerificationCaseService } from './CreateVerificationCaseService';
import { ListVerificationHistoryService } from './ListVerificationHistoryService';
import { GetVerificationCaseService } from './GetVerificationCaseService';
import { UploadImageService } from './UploadImageService';

const jwtAccessExpiresIn =
  (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue;

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret:
        process.env.JWT_ACCESS_SECRET ??
        'local-development-access-secret-change-me',
      signOptions: {
        expiresIn: jwtAccessExpiresIn,
      },
    }),
  ],
  controllers: [VerificationController, UploadController],
  providers: [
    CreateVerificationCaseService,
    ListVerificationHistoryService,
    GetVerificationCaseService,
    UploadImageService,
    VerificationRepository,
    UserRepository,
    JwtAuthGuard,
  ],
})
export class VerificationModule {}