import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDTO } from '../../api/dto/auth/LoginRequestDTO';
import { AuthResponseDTO } from '../../api/dto/auth/AuthResponseDTO';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';

@Injectable()
export class LoginService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async login(request: LoginRequestDTO): Promise<AuthResponseDTO> {
    const email = request.email?.trim().toLowerCase();
    const password = request.password;

    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is disabled.');
    }

    const passwordMatches = await this.passwordHasher.verify(
      user.passwordHash,
      password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}