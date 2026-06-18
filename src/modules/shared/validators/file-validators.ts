export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;       // 10MB per file
export const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024;  // 50MB per request

export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'VAL-APP-008: 許可されていないファイル形式です',
  SIZE_EXCEEDED: 'VAL-APP-009: ファイルサイズが上限（10MB）を超えています',
  REQUIRED: 'VAL-APP-010: 領収書ファイルを添付してください',
};

// Helper functions for programmatic validation (used in services)
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
}
