export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
} 