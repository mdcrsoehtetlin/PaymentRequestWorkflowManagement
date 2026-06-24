export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024; // 50MB per request

export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'VAL-APP-008: Invalid file format',
  SIZE_EXCEEDED: 'VAL-APP-009: File size exceeds the maximum limit (10MB)',
  REQUIRED: 'VAL-APP-010: Please attach the receipt file',
};

// Helper functions for programmatic validation (used in services)
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
}
