import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { VerificationAnalysisReportDTO } from '../../types/verification';

interface EvidenceListProps {
  report: VerificationAnalysisReportDTO;
}

function agreementVariant(agreement: string): 'success' | 'danger' | 'warning' | 'muted' {
  if (agreement === 'SUPPORTS') return 'success';
  if (agreement === 'CONTRADICTS') return 'danger';
  if (agreement === 'PARTIAL') return 'warning';
  return 'muted';
}

export function EvidenceList({ report }: EvidenceListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.evidence.length === 0 ? (
          <p className="text-sm text-slate-600">No related evidence found for this claim.</p>
        ) : (
          report.evidence.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                <Badge variant={agreementVariant(item.agreement)}>{item.agreement}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                Source: {item.sourceName} | Relevance: {item.relevanceScore}
              </p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
