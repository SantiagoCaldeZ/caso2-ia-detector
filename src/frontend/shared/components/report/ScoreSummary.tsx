import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { VerificationAnalysisReportDTO } from '../../types/verification';

interface ScoreSummaryProps {
  report: VerificationAnalysisReportDTO;
}

function ScorePill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function ScoreSummary({ report }: ScoreSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <ScorePill label="Evidence Score" value={report.evidenceScore} />
        <ScorePill label="Risk Score" value={report.riskScore} />
        <ScorePill label="Source Agreement" value={report.sourceAgreement} />
      </CardContent>
    </Card>
  );
}
