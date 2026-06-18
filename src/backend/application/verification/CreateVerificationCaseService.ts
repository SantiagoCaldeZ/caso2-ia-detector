import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditEventType,
  EvidenceAgreement,
  InputType,
  RecommendedAction,
  RiskSeverity,
  RiskSignalType,
  SourceAgreement,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateVerificationRequestDTO } from '../../api/dto/verification/CreateVerificationRequestDTO';
import { VerificationAnalysisReportDTO } from '../../api/dto/verification/VerificationAnalysisReportDTO';
import { AuthenticatedUserDTO } from '../../api/dto/auth/AuthenticatedRequest';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';

@Injectable()
export class CreateVerificationCaseService {
  constructor(
    private readonly verificationRepository: VerificationRepository,
  ) {}

  async create(
    request: CreateVerificationRequestDTO,
    currentUser: AuthenticatedUserDTO,
  ): Promise<VerificationAnalysisReportDTO> {
    const normalizedInput =
      await this.normalizeInputForMockFlow(request, currentUser);

    const traceId = randomUUID();

    const verificationCase =
      await this.verificationRepository.createProcessingCase({
        userId: currentUser.id,
        inputType: normalizedInput.inputType,
        rawInput: normalizedInput.rawInput,
        uploadedFileId: normalizedInput.uploadedFileId,
        originalInputPreview: normalizedInput.originalInputPreview,
      });

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.VERIFICATION_CREATED,
      message: 'Verification case created.',
      traceId,
      metadata: {
        inputType: normalizedInput.inputType,
      },
    });

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.INPUT_PREPROCESSED,
      message: `${normalizedInput.inputType} input was preprocessed in mock mode.`,
      traceId,
    });

    const extractedClaim = this.extractMockClaim(normalizedInput.contentForClaimExtraction);

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.CLAIM_EXTRACTED,
      message: 'Main claim was extracted.',
      traceId,
      metadata: {
        extractionMode: 'mock',
      },
    });

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.EVIDENCE_SEARCH_STARTED,
      message: 'Evidence search started using mock provider.',
      traceId,
    });

    const scenario = this.detectScenario(normalizedInput.contentForClaimExtraction);

    const evidence = this.buildMockEvidence(verificationCase.id, scenario);
    const riskSignals = this.buildMockRiskSignals(
      verificationCase.id,
      scenario,
      normalizedInput.inputType,
    );

    await this.verificationRepository.createEvidenceMany(evidence);
    await this.verificationRepository.createRiskSignalMany(riskSignals);

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.EVIDENCE_SEARCH_COMPLETED,
      message: 'Mock evidence search completed.',
      traceId,
      metadata: {
        providerStatus: 'SUCCESS',
        cacheStatus: 'MISS',
        mockInputType: normalizedInput.inputType,
      },
    });

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.RISK_ANALYSIS_COMPLETED,
      message: 'Risk analysis completed.',
      traceId,
    });

    const recommendation = this.buildRecommendation(scenario);

    await this.verificationRepository.completeCase({
      caseId: verificationCase.id,
      extractedClaim,
      evidenceScore: recommendation.evidenceScore,
      riskScore: recommendation.riskScore,
      sourceAgreement: recommendation.sourceAgreement,
      recommendedAction: recommendation.recommendedAction,
      recommendationReason: recommendation.recommendationReason,
    });

    await this.verificationRepository.createAuditLog({
      caseId: verificationCase.id,
      userId: currentUser.id,
      eventType: AuditEventType.ANALYSIS_REPORT_GENERATED,
      message: 'Verification analysis report generated.',
      traceId,
    });

    const savedReport =
      await this.verificationRepository.findReportByCaseId(
        verificationCase.id,
      );

    if (!savedReport || !savedReport.extractedClaim) {
      throw new Error('Verification report could not be loaded.');
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

  private buildPreview(text: string): string {
    return text.length <= 120 ? text : `${text.slice(0, 117)}...`;
  }

  private async normalizeInputForMockFlow(
    request: CreateVerificationRequestDTO,
    currentUser: AuthenticatedUserDTO,
  ): Promise<{
    inputType: InputType;
    rawInput?: string;
    uploadedFileId?: string;
    originalInputPreview: string;
    contentForClaimExtraction: string;
  }> {
    if (request.inputType === 'TEXT') {
      const text = request.text?.trim();

      if (!text || text.length < 20) {
        throw new BadRequestException(
          'Text verification requires at least 20 characters.',
        );
      }

      return {
        inputType: InputType.TEXT,
        rawInput: text,
        originalInputPreview: this.buildPreview(text),
        contentForClaimExtraction: text,
      };
    }

    if (request.inputType === 'URL') {
      const url = request.url?.trim();

      if (!url) {
        throw new BadRequestException('URL is required for URL verification.');
      }

      try {
        // URL constructor acts as basic syntax validation for demo mode.
        new URL(url);
      } catch {
        throw new BadRequestException('A valid URL is required.');
      }

      const simulatedContent = `Mock extracted content from ${url}. The page claims a relevant public statement and requires verification context.`;

      return {
        inputType: InputType.URL,
        rawInput: url,
        originalInputPreview: this.buildPreview(url),
        contentForClaimExtraction: simulatedContent,
      };
    }

    if (request.inputType === 'IMAGE') {
      const uploadedFileId = request.uploadedFileId?.trim();

      if (!uploadedFileId) {
        throw new BadRequestException(
          'uploadedFileId is required for IMAGE verification.',
        );
      }

      const uploadedFile =
        await this.verificationRepository.findUploadedFileById(uploadedFileId);

      if (!uploadedFile) {
        throw new NotFoundException('Uploaded image was not found.');
      }

      if (uploadedFile.ownerUserId !== currentUser.id) {
        throw new ForbiddenException(
          'You cannot verify a file that belongs to another user.',
        );
      }

      const simulatedOcr = `Mock OCR extracted text from image ${uploadedFile.originalFileName}. This screenshot references a public claim and needs editorial review.`;

      return {
        inputType: InputType.IMAGE,
        uploadedFileId,
        originalInputPreview: this.buildPreview(
          `Image: ${uploadedFile.originalFileName}`,
        ),
        contentForClaimExtraction: simulatedOcr,
      };
    }

    throw new BadRequestException('Invalid input type.');
  }

  private extractMockClaim(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0]?.trim();

    if (firstSentence && firstSentence.length >= 20) {
      return firstSentence;
    }

    return this.buildPreview(text);
  }

  private detectScenario(
    text: string,
  ): 'READY' | 'DO_NOT_PUBLISH' | 'NEEDS_REVIEW' {
    const normalized = text.toLowerCase();

    if (
      normalized.includes('contradice') ||
      normalized.includes('viral') ||
      normalized.includes('cadena') ||
      normalized.includes('sin confirmar')
    ) {
      return 'DO_NOT_PUBLISH';
    }

    if (
      normalized.includes('ocr') ||
      normalized.includes('parcial') ||
      normalized.includes('captura') ||
      normalized.includes('imagen')
    ) {
      return 'NEEDS_REVIEW';
    }

    return 'READY';
  }

  private buildRecommendation(scenario: 'READY' | 'DO_NOT_PUBLISH' | 'NEEDS_REVIEW') {
    if (scenario === 'DO_NOT_PUBLISH') {
      return {
        evidenceScore: 35,
        riskScore: 76,
        sourceAgreement: SourceAgreement.LOW,
        recommendedAction: RecommendedAction.DO_NOT_PUBLISH_YET,
        recommendationReason:
          'Risk is high and the available evidence does not support publishing.',
      };
    }

    if (scenario === 'NEEDS_REVIEW') {
      return {
        evidenceScore: 61,
        riskScore: 48,
        sourceAgreement: SourceAgreement.MEDIUM,
        recommendedAction: RecommendedAction.NEEDS_MANUAL_REVIEW,
        recommendationReason:
          'Evidence is partial and the case requires human editorial judgment before moving forward.',
      };
    }

    return {
      evidenceScore: 92,
      riskScore: 20,
      sourceAgreement: SourceAgreement.HIGH,
      recommendedAction: RecommendedAction.READY_FOR_EDITORIAL_REVIEW,
      recommendationReason:
        'Evidence is strong, risk is low, and multiple relevant sources agree.',
    };
  }

  private buildMockEvidence(
    caseId: string,
    scenario: 'READY' | 'DO_NOT_PUBLISH' | 'NEEDS_REVIEW',
  ) {
    if (scenario === 'DO_NOT_PUBLISH') {
      return [
        {
          caseId,
          title: 'No official confirmation found',
          sourceName: 'Mock Fact Check Source',
          sourceUrl: `https://example.org/mock/no-confirmation/${caseId}`,
          publisher: 'Mock Fact Check Source',
          summary:
            'The reviewed sources do not provide official confirmation for the extracted claim.',
          relevanceScore: 65,
          agreement: EvidenceAgreement.UNKNOWN,
          provider: 'mock',
        },
        {
          caseId,
          title: 'Contradictory evidence detected',
          sourceName: 'Mock Public Record',
          sourceUrl: `https://example.org/mock/contradiction/${caseId}`,
          publisher: 'Mock Public Record',
          summary:
            'A reviewed source contradicts the extracted claim.',
          relevanceScore: 82,
          agreement: EvidenceAgreement.CONTRADICTS,
          provider: 'mock',
        },
      ];
    }

    if (scenario === 'NEEDS_REVIEW') {
      return [
        {
          caseId,
          title: 'Partial source agreement',
          sourceName: 'Mock Editorial Source',
          sourceUrl: `https://example.org/mock/partial/${caseId}`,
          publisher: 'Mock Editorial Source',
          summary:
            'The reviewed evidence partially supports the extracted claim.',
          relevanceScore: 70,
          agreement: EvidenceAgreement.PARTIAL,
          provider: 'mock',
        },
        {
          caseId,
          title: 'Pending confirmation source',
          sourceName: 'Mock External Source',
          sourceUrl: `https://example.org/mock/pending/${caseId}`,
          publisher: 'Mock External Source',
          summary:
            'Additional editorial verification is required before publication.',
          relevanceScore: 64,
          agreement: EvidenceAgreement.UNKNOWN,
          provider: 'mock',
        },
      ];
    }

    return [
      {
        caseId,
        title: 'Official statement supports the claim',
        sourceName: 'Mock Official Institution',
        sourceUrl: `https://example.org/mock/official/${caseId}`,
        publisher: 'Mock Official Institution',
        summary:
          'The official statement supports the extracted claim.',
        relevanceScore: 92,
        agreement: EvidenceAgreement.SUPPORTS,
        provider: 'mock',
      },
      {
        caseId,
        title: 'Independent source confirms the report',
        sourceName: 'Mock Verified Source',
        sourceUrl: `https://example.org/mock/verified/${caseId}`,
        publisher: 'Mock Verified Source',
        summary:
          'A second reviewed source supports the extracted claim.',
        relevanceScore: 88,
        agreement: EvidenceAgreement.SUPPORTS,
        provider: 'mock',
      },
    ];
  }

  private buildMockRiskSignals(
    caseId: string,
    scenario: 'READY' | 'DO_NOT_PUBLISH' | 'NEEDS_REVIEW',
    inputType: InputType,
  ) {
    if (scenario === 'DO_NOT_PUBLISH') {
      return [
        {
          caseId,
          type: RiskSignalType.CONTRADICTORY_EVIDENCE,
          severity: RiskSeverity.HIGH,
          description:
            'High risk because relevant evidence contradicts the extracted claim.',
        },
        {
          caseId,
          type: RiskSignalType.LOW_SOURCE_AGREEMENT,
          severity: RiskSeverity.MEDIUM,
          description:
            'Reviewed sources show low agreement.',
        },
      ];
    }

    if (scenario === 'NEEDS_REVIEW') {
      return [
        {
          caseId,
          type:
            inputType === InputType.URL
              ? RiskSignalType.SOURCE_CONTENT_UNAVAILABLE
              : RiskSignalType.OCR_UNCERTAINTY,
          severity: RiskSeverity.MEDIUM,
          description:
            inputType === InputType.URL
              ? 'The submitted URL could not be fully read in mock extraction mode. Manual review is recommended.'
              : 'The content may require manual validation due to partial extraction context.',
        },
      ];
    }

    return [
      {
        caseId,
        type: RiskSignalType.EMOTIONAL_LANGUAGE,
        severity: RiskSeverity.LOW,
        description:
          'Some promotional or emotional wording was detected, but overall risk remains low.',
      },
    ];
  }
}