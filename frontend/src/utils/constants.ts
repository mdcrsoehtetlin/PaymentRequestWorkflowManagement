// File size and upload constraints (matches backend file-validators.ts)
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_FILE_SIZE_BYTES = 50 * 1024 * 1024;

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
  STATUS_LABELS_JP,
  STATUS_COLORS,
  EDITABLE_STATUSES,
  ACTION_LABELS_JP,
  ACTION_BADGE_COLORS,
  PAYMENT_TYPE_LABELS_JP,
  PAYMENT_METHOD_LABELS_JP,
  CURRENCY_CODES,
  ROLE_LABELS_JP,
  BANK_INFO_REQUIRED_METHODS,
} from '../types';
