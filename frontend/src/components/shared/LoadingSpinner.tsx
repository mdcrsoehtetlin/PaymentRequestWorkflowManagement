import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  variant?: 'page' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ variant = 'inline', size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;

  if (variant === 'page') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/80">
        {spinner}
        {message && <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {spinner}
      {message && <span className="text-sm text-slate-600">{message}</span>}
    </div>
  );
}
