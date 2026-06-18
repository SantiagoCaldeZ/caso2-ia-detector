import { Injectable } from '@nestjs/common';
import { VerificationHistoryItemDTO } from '../../api/dto/verification/VerificationHistoryItemDTO';
import { AuthenticatedUserDTO } from '../../api/dto/auth/AuthenticatedRequest';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';

@Injectable()
export class ListVerificationHistoryService {
  constructor(
    private readonly verificationRepository: VerificationRepository,
  ) {}

  async list(
    currentUser: AuthenticatedUserDTO,
  ): Promise<VerificationHistoryItemDTO[]> {
    const cases = await this.verificationRepository.listHistoryByUserId(
      currentUser.id,
    );

    return cases.map((item) => ({
      caseId: item.id,
      inputType: item.inputType,
      originalInputPreview: item.originalInputPreview,
      extractedClaim: item.extractedClaim ?? undefined,
      evidenceScore: item.evidenceScore ?? undefined,
      riskScore: item.riskScore ?? undefined,
      sourceAgreement: item.sourceAgreement ?? undefined,
      recommendedAction: item.recommendedAction ?? undefined,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}