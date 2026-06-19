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

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {message && <p className="text-sm text-slate-600 font-medium">{message}</p>}
    </div>
  );

  if (variant === 'page') {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-4">{spinner}</div>;
}
