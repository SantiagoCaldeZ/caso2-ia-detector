export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'JOURNALIST' | 'ADMIN';
}