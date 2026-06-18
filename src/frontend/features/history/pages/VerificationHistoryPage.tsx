import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getVerificationHistory } from '../../../shared/api/verificationApi';
import { recommendationLabel } from '../../../shared/components/report/labels';
import { Alert } from '../../../shared/components/ui/alert';
import { Badge } from '../../../shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';

export function VerificationHistoryPage() {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['verification-history', 'all'],
    queryFn: getVerificationHistory,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Verification History</CardTitle>
            <CardDescription>All verification cases for current user.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? <p className="text-sm text-slate-600">Loading history...</p> : null}
        {query.isError ? (
          <Alert variant="danger">Could not load history. Please try again.</Alert>
        ) : null}
        {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
          <Alert>No verification cases yet.</Alert>
        ) : null}
        {query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-2">Input</th>
                  <th className="px-3 py-2">Preview</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Recommendation</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.caseId} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{item.inputType}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.originalInputPreview}</td>
                    <td className="px-3 py-2">
                      <Badge variant="muted">{item.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {item.recommendedAction ? recommendationLabel[item.recommendedAction] : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/app/history/${item.caseId}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
