import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getVerificationById } from '../../../shared/api/verificationApi';
import { toApiError } from '../../../shared/api/httpClient';
import { VerificationReportView } from '../../../shared/components/report/VerificationReportView';
import { Alert } from '../../../shared/components/ui/alert';
import { Button } from '../../../shared/components/ui/button';
import { Skeleton } from '../../../shared/components/ui/skeleton';

export function VerificationResultPage() {
  const navigate = useNavigate();
  const params = useParams<{ caseId: string }>();

  const caseId = params.caseId;

  const query = useQuery({
    queryKey: ['verification-case', caseId],
    queryFn: () => getVerificationById(caseId ?? ''),
    enabled: Boolean(caseId),
  });

  if (!caseId) {
    return <Alert variant="danger">Invalid case id.</Alert>;
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const apiError = toApiError(query.error);
    return (
      <Alert variant="danger">
        {apiError.traceId ? `${apiError.message} (traceId: ${apiError.traceId})` : apiError.message}
      </Alert>
    );
  }

  if (!query.data) {
    return <Alert variant="warning">Verification report is not available.</Alert>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => navigate('/app')}>
          Back to verify
        </Button>
        <Button variant="ghost" onClick={() => navigate('/app/history')}>
          Go to history
        </Button>
        <Link className="text-sm font-medium text-[var(--primary)] hover:underline" to={`/app/history/${caseId}`}>
          Open history detail view
        </Link>
      </div>
      <VerificationReportView report={query.data} />
    </div>
  );
}
