export const ALLOWED_FILE_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'VAL-APP-008: 許可されていないファイル形式です',
  SIZE_EXCEEDED: 'VAL-APP-009: ファイルサイズが上限（10MB）を超えています',
  REQUIRED: 'VAL-APP-010: 領収書ファイルを添付してください',
};

// Helper functions for programmatic validation (used in services)
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_FILE_MIME_TYPES.includes(mimeType);
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}
