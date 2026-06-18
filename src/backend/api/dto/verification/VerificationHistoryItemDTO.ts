export interface VerificationHistoryItemDTO {
  caseId: string;
  inputType: 'TEXT' | 'URL' | 'IMAGE';
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