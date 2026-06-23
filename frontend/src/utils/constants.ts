// File size and upload constraints (matches backend file-validators.ts)
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;       // 10MB per file
export const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024;  // 50MB per request

// Breakdown item constraints (matches backend DTO validation)
export const MAX_BREAKDOWN_ITEMS = 15;
export const MIN_BREAKDOWN_ITEMS = 1;

// Pagination defaults (matches backend PaginationQueryDto defaults)
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// UI interaction timings
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 4000;

// Rejection comment minimum length (business rule)
export const MIN_REJECTION_COMMENT_LENGTH = 10;

// Re-export all enum display helpers from the corrected types file
export {
  STATUS_LABELS_EN,
  STATUS_COLORS,
  EDITABLE_STATUSES,
  ACTION_LABELS_EN,
  ACTION_BADGE_COLORS,
  PAYMENT_TYPE_LABELS_EN,
  PAYMENT_METHOD_LABELS_EN,
  CURRENCY_CODES,
  ROLE_LABELS_EN,
  BANK_INFO_REQUIRED_METHODS,
} from '../types';
