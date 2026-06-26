import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  colSpan?: number;
}

export interface SearchFilterBarProps {
  fields: FilterField[];
  values: Record<string, string | number>;
  onApply: (values: Record<string, string | number>) => void;
  onClear?: () => void;
  showSearchButton?: boolean;
  showClearButton?: boolean;
  actions?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchFilterBar({
  fields,
  values,
  onApply,
  onClear,
  showSearchButton = true,
  showClearButton,
  actions,
}: SearchFilterBarProps) {
  const shouldShowClear = showClearButton ?? !!onClear;

  // Local state for draft filters
  const [localValues, setLocalValues] = useState<Record<string, string | number>>(values);

  // Sync when parent values change (e.g., cleared from outside)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalValues(values);
  }, [values]);

  const handleChange = (key: string, value: string | number) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onApply(localValues);
  };

  const handleClear = () => {
    setLocalValues({});
    if (onClear) {
      onClear();
    } else {
      onApply({});
    }
  };

  const inputClasses = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed';

  const hasActiveFilters = fields.some((field) => {
    const val = localValues[field.key];
    return val !== '' && val !== undefined && val !== null;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="grid gap-4 items-end grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.colSpan ? `col-span-${field.colSpan}` : 'w-full'}
          >
            <label className="space-y-2 text-sm text-slate-700 block">
              <span className="block">{field.label}</span>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  value={String(localValues[field.key] ?? '')}
                  placeholder={field.placeholder}
                  className={inputClasses}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
              
              {field.type === 'select' && (
                <CustomDropdown
                  options={field.options || []}
                  value={localValues[field.key] ?? ''}
                  placeholder={field.placeholder || 'Select...'}
                  onChange={(val) => handleChange(field.key, val ?? '')}
                />
              )}
              
              {field.type === 'date' && (
                <input
                  type="date"
                  value={String(localValues[field.key] ?? '')}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClasses}
                />
              )}
            </label>
          </div>
        ))}
        
        {(showSearchButton || shouldShowClear || actions) && (
          <div className="flex items-center gap-3 pb-0.5 xl:col-span-1 md:col-span-2 sm:col-span-2 lg:col-span-4 xl:w-auto w-full justify-start xl:justify-end">
            {actions}
            {showSearchButton && (
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 whitespace-nowrap transition-all duration-200"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            )}
            {shouldShowClear && (
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasActiveFilters}
                className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                  hasActiveFilters 
                    ? 'text-slate-700 hover:bg-slate-50 focus:ring-slate-500 cursor-pointer' 
                    : 'text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
