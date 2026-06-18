import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/PrismaService';

export interface HealthResponseDTO {
  status: 'ok';
  timestamp: string;
  service: 'ia-detector-backend';
  database: 'ok';
}

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHealth(): Promise<HealthResponseDTO> {
    await this.prismaService.checkConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ia-detector-backend',
      database: 'ok',
    };
  }
}