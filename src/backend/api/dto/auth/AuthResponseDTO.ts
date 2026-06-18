import { UserDTO } from './UserDTO';

export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
}