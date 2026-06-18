import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from '../dto/auth/AuthenticatedRequest';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'JOURNALIST' | 'ADMIN';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing authorization header.');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header.');
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active.');
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}