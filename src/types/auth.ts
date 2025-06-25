export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
  token_version: number;
} 