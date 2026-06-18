import { VerificationAnalysisReportDTO } from '../../types/verification';

type Recommendation = VerificationAnalysisReportDTO['recommendedAction'];

export const recommendationLabel: Record<Recommendation, string> = {
  READY_FOR_EDITORIAL_REVIEW: 'Ready for editorial review',
  DO_NOT_PUBLISH_YET: 'Do not publish yet',
  NEEDS_MANUAL_REVIEW: 'Needs manual review',
};

export function recommendationVariant(
  action: Recommendation,
): 'success' | 'danger' | 'warning' {
  if (action === 'READY_FOR_EDITORIAL_REVIEW') {
    return 'success';
  }

  if (action === 'DO_NOT_PUBLISH_YET') {
    return 'danger';
  }

  return 'warning';
}

export const riskSeverityLabel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;
