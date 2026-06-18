import { Injectable } from '@nestjs/common';
import {
  AuditEventType,
  EvidenceAgreement,
  InputType,
  Prisma,
  RecommendedAction,
  RiskSeverity,
  RiskSignalType,
  SourceAgreement,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/PrismaService';

interface CreateProcessingCaseInput {
  userId: string;
  inputType: InputType;
  rawInput?: string;
  uploadedFileId?: string;
  originalInputPreview: string;
}

interface CreateUploadedFileInput {
  ownerUserId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  sha256Hash: string;
}

interface CompleteCaseInput {
  caseId: string;
  extractedClaim: string;
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: SourceAgreement;
  recommendedAction: RecommendedAction;
  recommendationReason: string;
}

interface CreateEvidenceInput {
  caseId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publisher?: string;
  publishedAt?: Date;
  summary: string;
  relevanceScore: number;
  agreement: EvidenceAgreement;
  provider: string;
}

interface CreateRiskSignalInput {
  caseId: string;
  type: RiskSignalType;
  severity: RiskSeverity;
  description: string;
}

interface CreateAuditLogInput {
  caseId?: string;
  userId?: string;
  eventType: AuditEventType;
  message: string;
  traceId: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class VerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createProcessingCase(input: CreateProcessingCaseInput) {
    return this.prismaService.verificationCase.create({
      data: {
        userId: input.userId,
        inputType: input.inputType,
        rawInput: input.rawInput,
        uploadedFileId: input.uploadedFileId,
        originalInputPreview: input.originalInputPreview,
        status: VerificationStatus.PROCESSING,
      },
    });
  }

  createUploadedFile(input: CreateUploadedFileInput) {
    return this.prismaService.uploadedFile.create({
      data: {
        ownerUserId: input.ownerUserId,
        originalFileName: input.originalFileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storagePath: input.storagePath,
        sha256Hash: input.sha256Hash,
      },
    });
  }

  findUploadedFileByIdForUser(uploadedFileId: string, userId: string) {
    return this.prismaService.uploadedFile.findFirst({
      where: {
        id: uploadedFileId,
        ownerUserId: userId,
        deletedAt: null,
      },
    });
  }

  findUploadedFileById(uploadedFileId: string) {
    return this.prismaService.uploadedFile.findFirst({
      where: {
        id: uploadedFileId,
        deletedAt: null,
      },
    });
  }

  completeCase(input: CompleteCaseInput) {
    return this.prismaService.verificationCase.update({
      where: { id: input.caseId },
      data: {
        extractedClaim: input.extractedClaim,
        evidenceScore: input.evidenceScore,
        riskScore: input.riskScore,
        sourceAgreement: input.sourceAgreement,
        recommendedAction: input.recommendedAction,
        recommendationReason: input.recommendationReason,
        status: VerificationStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  createEvidenceMany(items: CreateEvidenceInput[]) {
    return this.prismaService.evidenceResult.createMany({
      data: items,
    });
  }

  createRiskSignalMany(items: CreateRiskSignalInput[]) {
    return this.prismaService.riskSignal.createMany({
      data: items,
    });
  }

  createAuditLog(input: CreateAuditLogInput) {
    return this.prismaService.auditLog.create({
      data: {
        caseId: input.caseId,
        userId: input.userId,
        eventType: input.eventType,
        message: input.message,
        traceId: input.traceId,
        metadata: input.metadata,
      },
    });
  }

  findReportByCaseId(caseId: string) {
    return this.prismaService.verificationCase.findUnique({
      where: { id: caseId },
      include: {
        evidenceResults: {
          orderBy: {
            relevanceScore: 'desc',
          },
        },
        riskSignals: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  listHistoryByUserId(userId: string) {
    return this.prismaService.verificationCase.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  findReportByCaseIdForUser(caseId: string, userId: string) {
    return this.prismaService.verificationCase.findFirst({
      where: {
        id: caseId,
        userId,
      },
      include: {
        evidenceResults: {
          orderBy: {
            relevanceScore: 'desc',
          },
        },
        riskSignals: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}