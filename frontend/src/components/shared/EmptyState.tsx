import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-300 w-16 h-16 mb-4 [&>svg]:w-full [&>svg]:h-full">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-600">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
