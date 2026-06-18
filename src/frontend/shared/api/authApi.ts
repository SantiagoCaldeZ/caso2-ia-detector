import {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserDTO,
} from '../types/auth';
import { httpClient } from './httpClient';

export async function registerUser(payload: RegisterRequestDTO): Promise<UserDTO> {
  const response = await httpClient.post<UserDTO>('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginRequestDTO): Promise<AuthResponseDTO> {
  const response = await httpClient.post<AuthResponseDTO>('/auth/login', payload);
  return response.data;
}

export async function getCurrentUser(): Promise<UserDTO> {
  const response = await httpClient.get<UserDTO>('/auth/me');
  return response.data;
}

export async function refreshSession(): Promise<{ accessToken: string }> {
  const response = await httpClient.post<{ accessToken: string }>('/auth/refresh');
  return response.data;
}

export async function logoutSession(): Promise<void> {
  await httpClient.post('/auth/logout');
}
