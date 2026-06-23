import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  /** Called when the button is clicked */
  onClick: () => void;
  /** When true, shows a spinning animation on the icon */
  isLoading?: boolean;
  /** Button label (defaults to 'Refresh') */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * @description Standard refresh button for all dashboards.
 * Uses the Secondary button variant from §9.5.4 with a RefreshCw icon.
 * Displays a spin animation when isLoading is true.
 *
 * @param onClick - Callback function triggered on button click
 * @param isLoading - Displays spinning icon when true
 * @param label - Button text, defaults to 'Refresh'
 * @param size - 'sm' for compact, 'md' (default) for standard
 */
export function RefreshButton({
  onClick,
  isLoading = false,
  label = 'Refresh',
  size = 'md',
}: RefreshButtonProps) {
  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm';

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`
        ${sizeClasses}
        bg-white hover:bg-slate-50 text-slate-700
        font-medium rounded-lg
        border border-slate-300 shadow-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center gap-2
      `}
    >
      <RefreshCw
        className={`${iconSize} ${isLoading ? 'animate-spin' : ''}`}
      />
      {label}
    </button>
  );
}
