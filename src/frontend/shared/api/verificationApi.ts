import {
  CreateVerificationRequestDTO,
  UploadedFileDTO,
  VerificationAnalysisReportDTO,
  VerificationHistoryItemDTO,
} from '../types/verification';
import { httpClient } from './httpClient';

interface HistoryResponse {
  items?: VerificationHistoryItemDTO[];
}

export async function createVerification(
  payload: CreateVerificationRequestDTO,
): Promise<VerificationAnalysisReportDTO> {
  const response = await httpClient.post<VerificationAnalysisReportDTO>(
    '/verifications',
    payload,
  );

  return response.data;
}

export async function getVerificationHistory(): Promise<VerificationHistoryItemDTO[]> {
  const response = await httpClient.get<VerificationHistoryItemDTO[] | HistoryResponse>(
    '/verifications',
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.items ?? [];
}

export async function getVerificationById(
  caseId: string,
): Promise<VerificationAnalysisReportDTO> {
  const response = await httpClient.get<VerificationAnalysisReportDTO>(
    `/verifications/${caseId}`,
  );

  return response.data;
}

export async function uploadImage(file: File): Promise<UploadedFileDTO> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post<UploadedFileDTO>('/uploads/image', formData);

  return response.data;
}
