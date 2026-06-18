import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AuthController } from '../../api/controllers/AuthController';
import { JwtAuthGuard } from '../../api/guards/JwtAuthGuard';
import { PrismaModule } from '../../infrastructure/persistence/prisma/PrismaModule';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';
import { RegisterService } from './RegisterService';
import { LoginService } from './LoginService';

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
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    PasswordHasher,
    UserRepository,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}