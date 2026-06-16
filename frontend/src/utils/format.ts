/**
 * Format a NUMERIC string to display with thousand separators.
 * Input: "1234567.00" → Output: "1,234,567.00"
 */
export function formatCurrency(amount: string | number, currencyCode = 'MMK'): string {
  const num = Number(amount);
  if (isNaN(num)) return `0.00 ${currencyCode}`;
  return `${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyCode}`;
}

/** Format ISO date to YYYY/MM/DD */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

/** Format ISO date to YYYY/MM/DD HH:mm */
export function formatDateTime(isoDate: string | null | undefined): string {
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
