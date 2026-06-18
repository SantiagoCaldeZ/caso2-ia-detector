import { Controller, Get } from '@nestjs/common';
import {
  HealthResponseDTO,
  HealthService,
} from '../../application/health/HealthService';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthResponseDTO> {
    return this.healthService.getHealth();
  }
}