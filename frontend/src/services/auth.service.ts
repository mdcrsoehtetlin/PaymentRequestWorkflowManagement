import apiClient from './api-client';
import type { JwtPayload } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  },

  async refreshToken(): Promise<string> {
    const { data } = await apiClient.post('/auth/refresh');
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  async getCurrentUser(): Promise<JwtPayload> {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No token');
    // Decode JWT payload (no verification — server validates)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  },
};
