export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'JOURNALIST' | 'ADMIN';
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
}
