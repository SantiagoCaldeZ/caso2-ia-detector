export interface ApiError {
  statusCode: number;
  errorCode?: string;
  message: string;
  traceId?: string;
  details?: Record<string, unknown>;
}

export function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Something went wrong. Please try again.';
}
