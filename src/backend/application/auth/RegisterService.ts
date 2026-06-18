import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { RegisterRequestDTO } from '../../api/dto/auth/RegisterRequestDTO';
import { UserDTO } from '../../api/dto/auth/UserDTO';
import { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';

@Injectable()
export class RegisterService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(request: RegisterRequestDTO): Promise<UserDTO> {
    const name = request.name?.trim();
    const email = request.email?.trim().toLowerCase();
    const password = request.password;

    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('A valid email is required.');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Password must have at least 8 characters.',
      );
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const user = await this.userRepository.createJournalist({
      name,
      email,
      passwordHash,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}