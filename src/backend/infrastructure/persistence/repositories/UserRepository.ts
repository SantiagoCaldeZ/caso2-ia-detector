import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/PrismaService';

interface CreateJournalistUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  createJournalist(input: CreateJournalistUserInput): Promise<User> {
    return this.prismaService.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'JOURNALIST',
        status: 'ACTIVE',
      },
    });
  }
}