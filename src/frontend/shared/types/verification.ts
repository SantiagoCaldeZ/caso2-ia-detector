export type InputType = 'TEXT' | 'URL' | 'IMAGE';

export interface CreateVerificationRequestDTO {
  inputType: InputType;
  text?: string;
  url?: string;
  uploadedFileId?: string;
}

export interface UploadedFileDTO {
  id: string;
  originalFileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

export interface EvidenceDTO {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publisher?: string | null;
  publishedAt?: string | null;
  summary: string;
  relevanceScore: number;
  agreement: 'SUPPORTS' | 'CONTRADICTS' | 'PARTIAL' | 'UNKNOWN';
  provider: string;
}

export interface RiskSignalDTO {
  id: string;
  type:
    | 'NO_RELEVANT_EVIDENCE'
    | 'CONTRADICTORY_EVIDENCE'
    | 'LOW_SOURCE_AGREEMENT'
    | 'PROVIDER_UNAVAILABLE'
    | 'OCR_UNCERTAINTY'
    | 'UNKNOWN_SOURCE'
    | 'EMOTIONAL_LANGUAGE'
    | 'RECENT_BREAKING_CLAIM'
    | 'SOURCE_CONTENT_UNAVAILABLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface AuditTrailEventDTO {
  eventType: string;
  message: string;
  traceId: string;
  createdAt: string;
}

export interface VerificationAnalysisReportDTO {
  caseId: string;
  inputType: InputType;
  originalInputPreview: string;
  extractedClaim: string;
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction:
    | 'READY_FOR_EDITORIAL_REVIEW'
    | 'DO_NOT_PUBLISH_YET'
    | 'NEEDS_MANUAL_REVIEW';
  recommendationReason: string;
  evidence: EvidenceDTO[];
  riskSignals: RiskSignalDTO[];
  auditTrail: AuditTrailEventDTO[];
  createdAt: string;
  completedAt?: string;
}

export interface VerificationHistoryItemDTO {
  caseId: string;
  inputType: InputType;
  originalInputPreview: string;
  extractedClaim?: string;
  evidenceScore?: number;
  riskScore?: number;
  sourceAgreement?: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction?:
    | 'READY_FOR_EDITORIAL_REVIEW'
    | 'DO_NOT_PUBLISH_YET'
    | 'NEEDS_MANUAL_REVIEW';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}
