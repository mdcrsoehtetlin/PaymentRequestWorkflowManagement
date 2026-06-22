import { formatCurrency } from '../../utils/format';

interface CurrencyDisplayProps {
  amount: string | number;
  currencyCode?: string;
  showCurrency?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currencyCode = 'MMK',
  showCurrency = true,
  className = '',
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount, currencyCode);
  const displayValue = showCurrency ? formatted : formatted.replace(` ${currencyCode}`, '');

  return <span className={`font-mono ${className}`}>{displayValue}</span>;
}
