import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../errors/apiError';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export const httpClient = axios.create({
  baseURL: env.backendUrl,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    return {
      statusCode: error.response?.status ?? 0,
      errorCode: error.response?.data?.errorCode,
      message:
        error.response?.data?.message ??
        error.message ??
        'Unexpected request error.',
      traceId: error.response?.data?.traceId,
      details: error.response?.data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 0,
      message: error.message,
    };
  }

  return {
    statusCode: 0,
    message: 'Unexpected request error.',
  };
}
