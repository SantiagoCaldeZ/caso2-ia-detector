import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthSession } from './providers/AuthProvider';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { VerificationHubPage } from '../features/verification/pages/VerificationHubPage';
import { VerificationResultPage } from '../features/verification/pages/VerificationResultPage';
import { VerificationHistoryPage } from '../features/history/pages/VerificationHistoryPage';
import { VerificationCaseDetailPage } from '../features/history/pages/VerificationCaseDetailPage';
import { Skeleton } from '../shared/components/ui/skeleton';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto mt-16 max-w-2xl space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VerificationHubPage />} />
        <Route path="verification/:caseId" element={<VerificationResultPage />} />
        <Route path="history" element={<VerificationHistoryPage />} />
        <Route path="history/:caseId" element={<VerificationCaseDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
