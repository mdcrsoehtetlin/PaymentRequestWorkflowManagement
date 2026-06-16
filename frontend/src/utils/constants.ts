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

export { STATUS_LABELS_JP, STATUS_COLORS, EDITABLE_STATUSES } from '../types';
export { ACTION_LABELS_JP, ACTION_BADGE_COLORS } from '../types';
