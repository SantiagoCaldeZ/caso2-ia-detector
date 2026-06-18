import { Request } from 'express';

export interface AuthenticatedUserDTO {
  id: string;
  name: string;
  email: string;
  role: 'JOURNALIST' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserDTO;
}