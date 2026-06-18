import { Alert } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { VerificationAnalysisReportDTO } from '../../types/verification';
import { RecommendationBanner } from './RecommendationBanner';
import { ScoreSummary } from './ScoreSummary';
import { EvidenceList } from './EvidenceList';
import { RiskSignalList } from './RiskSignalList';
import { AuditTrailPanel } from './AuditTrailPanel';

const PARTIAL_REPORT_RISKS = new Set([
  'PROVIDER_UNAVAILABLE',
  'OCR_UNCERTAINTY',
  'SOURCE_CONTENT_UNAVAILABLE',
]);

interface VerificationReportViewProps {
  report: VerificationAnalysisReportDTO;
}

export function VerificationReportView({ report }: VerificationReportViewProps) {
  const hasPartialWarning = report.riskSignals.some((risk) =>
    PARTIAL_REPORT_RISKS.has(risk.type),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Extracted Claim</CardTitle>
          <CardDescription>Input type: {report.inputType}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">{report.extractedClaim}</p>
        </CardContent>
      </Card>

      {hasPartialWarning ? (
        <Alert variant="warning">
          This report may be partial due to provider or extraction limitations. Manual review is recommended.
        </Alert>
      ) : null}

      <RecommendationBanner report={report} />
      <ScoreSummary report={report} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EvidenceList report={report} />
        <RiskSignalList report={report} />
      </div>

      <AuditTrailPanel report={report} />
    </div>
  );
}
