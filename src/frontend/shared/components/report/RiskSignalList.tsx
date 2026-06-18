import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { VerificationAnalysisReportDTO } from '../../types/verification';
import { riskSeverityLabel } from './labels';

interface RiskSignalListProps {
  report: VerificationAnalysisReportDTO;
}

function severityVariant(severity: 'LOW' | 'MEDIUM' | 'HIGH'): 'muted' | 'warning' | 'danger' {
  if (severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'muted';
}

export function RiskSignalList({ report }: RiskSignalListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.riskSignals.length === 0 ? (
          <p className="text-sm text-slate-600">No risk signals were detected.</p>
        ) : (
          report.riskSignals.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{item.type}</p>
                <Badge variant={severityVariant(item.severity)}>
                  {riskSeverityLabel[item.severity]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
