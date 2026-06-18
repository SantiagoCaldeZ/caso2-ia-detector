import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { VerificationAnalysisReportDTO } from '../../types/verification';

interface AuditTrailPanelProps {
  report: VerificationAnalysisReportDTO;
}

export function AuditTrailPanel({ report }: AuditTrailPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {report.auditTrail.length === 0 ? (
          <p className="text-sm text-slate-600">No audit events are available.</p>
        ) : (
          report.auditTrail.map((event, index) => (
            <div key={`${event.traceId}-${index}`} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{event.eventType}</p>
              <p className="text-sm text-slate-600">{event.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(event.createdAt).toLocaleString()} | traceId: {event.traceId}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
