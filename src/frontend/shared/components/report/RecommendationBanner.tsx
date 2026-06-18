import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { recommendationLabel, recommendationVariant } from './labels';
import { VerificationAnalysisReportDTO } from '../../types/verification';

interface RecommendationBannerProps {
  report: VerificationAnalysisReportDTO;
}

export function RecommendationBanner({ report }: RecommendationBannerProps) {
  return (
    <Alert variant={recommendationVariant(report.recommendedAction)} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={recommendationVariant(report.recommendedAction)}>
          {recommendationLabel[report.recommendedAction]}
        </Badge>
        <span className="text-xs text-slate-600">Case {report.caseId}</span>
      </div>
      <p className="text-sm leading-6">{report.recommendationReason}</p>
    </Alert>
  );
}
