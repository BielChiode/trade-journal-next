import apiClient from './apiClient';
import { AuthCredentials, AuthResponse } from '../types/auth';

export const register = (credentials: AuthCredentials) =>
  apiClient.post<AuthResponse>('/auth/register', credentials);

export const login = (credentials: AuthCredentials) =>
  apiClient.post<AuthResponse>('/auth/login', credentials); 