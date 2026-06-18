import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUserDTO } from '../../api/dto/auth/AuthenticatedRequest';
import { VerificationAnalysisReportDTO } from '../../api/dto/verification/VerificationAnalysisReportDTO';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';

@Injectable()
export class GetVerificationCaseService {
  constructor(
    private readonly verificationRepository: VerificationRepository,
  ) {}

  async getById(
    caseId: string,
    currentUser: AuthenticatedUserDTO,
  ): Promise<VerificationAnalysisReportDTO> {
    const savedReport =
      await this.verificationRepository.findReportByCaseIdForUser(
        caseId,
        currentUser.id,
      );

    if (!savedReport || !savedReport.extractedClaim) {
      throw new NotFoundException('Verification case was not found.');
    }

    return {
      caseId: savedReport.id,
      inputType: savedReport.inputType,
      originalInputPreview: savedReport.originalInputPreview,
      extractedClaim: savedReport.extractedClaim,
      evidenceScore: savedReport.evidenceScore ?? 0,
      riskScore: savedReport.riskScore ?? 0,
      sourceAgreement: savedReport.sourceAgreement ?? 'LOW',
      recommendedAction:
        savedReport.recommendedAction ?? 'NEEDS_MANUAL_REVIEW',
      recommendationReason: savedReport.recommendationReason ?? '',
      evidence: savedReport.evidenceResults.map((item) => ({
        id: item.id,
        title: item.title,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        publisher: item.publisher,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        summary: item.summary,
        relevanceScore: item.relevanceScore,
        agreement: item.agreement,
        provider: item.provider,
      })),
      riskSignals: savedReport.riskSignals.map((item) => ({
        id: item.id,
        type: item.type,
        severity: item.severity,
        description: item.description,
      })),
      auditTrail: savedReport.auditLogs.map((item) => ({
        eventType: item.eventType,
        message: item.message,
        traceId: item.traceId,
        createdAt: item.createdAt.toISOString(),
      })),
      createdAt: savedReport.createdAt.toISOString(),
      completedAt: savedReport.completedAt?.toISOString(),
    };
  }
}