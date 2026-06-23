import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse } from '../types';

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Helper to trigger global toasts from outside React
const triggerToast = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('globalToast', { detail: { type, message } }),
    );
  }
};

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 401:
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        break;
      case 403:
        triggerToast(
          'error',
          data?.message || 'You do not have permission to perform this action',
        );
        break;
      case 409:
        triggerToast(
          'warning',
          'This request has been updated by another user',
        );
        // Auto-refresh the page data (optional implementation)
        break;
      case 422:
        // Business rule error — display to user
        triggerToast(
          'error',
          data?.message || 'A business rule error occurred',
        );
        break;
      case 500:
        triggerToast(
          'error',
          'A system error occurred. Please contact the administrator.',
        );
        break;
      default:
        triggerToast('error', data?.message || 'An error occurred');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
