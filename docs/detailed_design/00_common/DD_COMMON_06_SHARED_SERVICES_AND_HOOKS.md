# DD_COMMON_06 — Shared Services & Hooks

> **Doc ID:** PRWM-DD-COM-006 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Frontend Services (`frontend/src/services/`)

### 1.1 API Client (`api-client.ts`)

Centralized Axios instance for all REST API calls.

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiClient: AxiosInstance = axios.create({
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

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Attempt token refresh, or redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

### 1.2 Auth Service (`auth.service.ts`)

```typescript
import apiClient from './api-client';

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
```

### 1.3 WebSocket Service (`websocket.service.ts`)

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: number, role: string): void {
    this.socket = io('/socket.io', {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('accessToken') },
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.socket?.emit('joinRoom', { role, userId });
    });

    this.socket.on('disconnect', () => {
      this.handleReconnect();
    });
  }

  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    setTimeout(() => {
      this.reconnectAttempts++;
      this.socket?.connect();
    }, delay);
  }
}

export const wsService = new WebSocketService();
```

---

## 2. Frontend Hooks (`frontend/src/hooks/`)

### 2.1 useAuth (`useAuth.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { JwtPayload } from '@/types';

interface UseAuthReturn {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const payload = authService.getCurrentUser();
      setUser(payload);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    const payload = await authService.getCurrentUser();
    setUser(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return { user, isAuthenticated: !!user, isLoading, login, logout };
}
```

### 2.2 useWebSocket (`useWebSocket.ts`)

```typescript
import { useEffect, useCallback } from 'react';
import { wsService } from '@/services/websocket.service';

export function useWebSocket(userId: number, role: string) {
  useEffect(() => {
    wsService.connect(userId, role);
    return () => wsService.disconnect();
  }, [userId, role]);

  const onStatusUpdate = useCallback(
    (callback: (data: StatusUpdatePayload) => void) => {
      wsService.on('statusUpdate', callback);
      return () => wsService.off('statusUpdate', callback);
    },
    [],
  );

  const onNotification = useCallback(
    (callback: (data: NotificationPayload) => void) => {
      wsService.on('notification', callback);
      return () => wsService.off('notification', callback);
    },
    [],
  );

  return { onStatusUpdate, onNotification };
}
```

### 2.3 useConfirmDialog (`useConfirmDialog.ts`)

```typescript
import { useState, useCallback } from 'react';

interface DialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmDialogReturn {
  isOpen: boolean;
  config: DialogConfig | null;
  open: (config: DialogConfig) => void;
  close: () => void;
  confirm: () => Promise<void>;
  isLoading: boolean;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback((dialogConfig: DialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    setIsLoading(false);
  }, []);

  const confirm = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      await config.onConfirm();
      close();
    } finally {
      setIsLoading(false);
    }
  }, [config, close]);

  return { isOpen, config, open, close, confirm, isLoading };
}
```

### 2.4 usePagination (`usePagination.ts`)

```typescript
import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export function usePagination(defaultPageSize = 10): UsePaginationReturn {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const setPage = useCallback((p: number) => setPageState(p), []);
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1); // Reset to first page
  }, []);
  const reset = useCallback(() => { setPageState(1); }, []);

  return { page, pageSize, setPage, setPageSize, reset };
}
```

### 2.5 useToast (`useToast.ts`)

```typescript
import { useState, useCallback } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UseToastReturn {
  toasts: ToastMessage[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return {
    toasts,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    dismiss: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
  };
}
```

---

## 3. Frontend Utilities (`frontend/src/utils/`)

### 3.1 Format Utilities (`format.ts`)

```typescript
/**
 * Format a NUMERIC string to display with thousand separators.
 * Input: "1234567.00" → Output: "1,234,567.00"
 */
export function formatCurrency(amount: string, currencyCode = 'MMK'): string {
  const num = Number(amount);
  if (isNaN(num)) return `0.00 ${currencyCode}`;
  return `${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyCode}`;
}

/** Format ISO date to YYYY/MM/DD */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

/** Format ISO date to YYYY/MM/DD HH:mm */
export function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Format file size in bytes to human-readable */
export function formatFileSize(bytes: string | number): string {
  const b = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
```

### 3.2 Constants (`constants.ts`)

```typescript
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_BREAKDOWN_ITEMS = 15;
export const MIN_BREAKDOWN_ITEMS = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 4000;

// Re-export enum labels and colors from types
export { STATUS_LABELS_JP, STATUS_COLORS, EDITABLE_STATUSES } from '@/types';
export { ACTION_LABELS_JP, ACTION_BADGE_COLORS } from '@/types';
```

---

## 4. Backend Shared Services (`src/modules/shared/services/`)

### 4.1 Request Number Service (`request-number.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../entities/payment-request.entity';

@Injectable()
export class RequestNumberService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly repo: Repository<PaymentRequest>,
  ) {}

  /**
   * Generates next request number in format: PRF-YYYY-NNNNNN
   * Uses MAX query on current year's requests + 1
   */
  async generateNext(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRF-${year}-`;

    const result = await this.repo
      .createQueryBuilder('r')
      .select('MAX(r.requestNumber)', 'maxNum')
      .where('r.requestNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();

    let nextSeq = 1;
    if (result?.maxNum) {
      const currentSeq = parseInt(result.maxNum.split('-')[2], 10);
      nextSeq = currentSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }
}
```

### 4.2 File Upload Service (`file-upload.service.ts`)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('fileUpload.destination', './uploads/payment-requests');
  }

  validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('許可されていないファイル形式です（PDF, PNG, JPEG, JPGのみ）');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('ファイルサイズが上限（10MB）を超えています');
    }
  }

  async saveFile(file: Express.Multer.File, paymentRequestId: number): Promise<{
    storedFileName: string;
    fileStoragePath: string;
  }> {
    this.validateFile(file);
    const dir = path.join(this.uploadDir, String(paymentRequestId));
    await fs.mkdir(dir, { recursive: true });

    const storedFileName = `${uuidv4()}_${file.originalname}`;
    const fileStoragePath = path.join(dir, storedFileName);
    await fs.writeFile(fileStoragePath, file.buffer);

    return { storedFileName, fileStoragePath };
  }
}
```

### 4.3 Existing: WebSocket Gateway

The `WebsocketGateway` already exists at `src/modules/shared/websocket.gateway.ts`. Its API:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `sendStatusUpdate` | `(role: string, message: any) => void` | Broadcast to all users with a given role |
| `sendPersonalNotification` | `(userId: number, message: any) => void` | Send to a specific user's personal room |

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_03](./DD_COMMON_03_SHARED_TYPES.md) | Types used in services and hooks |
| [DD_COMMON_05](./DD_COMMON_05_SHARED_COMPONENTS.md) | Components that consume these hooks |
| [DD_COMMON_07](./DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Auth flow details |
| [DD_APPLICANT_05](../01_applicant/DD_APPLICANT_05_API_ENDPOINTS.md) | API endpoints called by services |
