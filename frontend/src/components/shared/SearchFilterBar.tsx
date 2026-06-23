import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterField {
  /** Unique key for the filter field */
  key: string;
  /** Label displayed above the field */
  label: string;
  /** Field type — determines which input is rendered */
  type: 'text' | 'select' | 'date';
  /** Placeholder text for text/date inputs */
  placeholder?: string;
  /** Options for select fields */
  options?: { value: string | number; label: string }[];
  /** Grid column span (defaults to 1) */
  colSpan?: number;
}

export interface SearchFilterBarProps {
  /** Filter field definitions — drives the entire bar layout */
  fields: FilterField[];
  /** Current filter values keyed by field.key */
  values: Record<string, string | number>;
  /** Called when any filter value changes */
  onChange: (key: string, value: string | number) => void;
  /** Called when user clicks Search or presses Enter */
  onSubmit: () => void;
  /** Called when user clicks Clear Filters */
  onClear?: () => void;
  /** Shows the Search button (defaults to true) */
  showSearchButton?: boolean;
  /** Shows the Clear Filters button (defaults to true when onClear is provided) */
  showClearButton?: boolean;
  /** Custom action buttons rendered after the search/clear buttons */
  actions?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @description Shared search & filter bar for all dashboard views.
 * Renders a composable grid of filter fields (text, select, date) inside a
 * card container. Enforces 300ms debounce on text inputs per §10 performance rules.
 * All styling follows §9.5.3 form control specifications exactly.
 *
 * @param fields - Array of filter field definitions
 * @param values - Current values for each field, keyed by field.key
 * @param onChange - Callback when a field value changes
 * @param onSubmit - Callback when Search is triggered (click or Enter key)
 * @param onClear - Callback to reset all filters
 */
export function SearchFilterBar({
  fields,
  values,
  onChange,
  onSubmit,
  onClear,
  showSearchButton = true,
  showClearButton,
  actions,
}: SearchFilterBarProps) {
  const shouldShowClear = showClearButton ?? !!onClear;
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Debounced text change handler (300ms per §10)
  const handleTextChange = useCallback(
    (key: string, value: string) => {
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
      }
      debounceTimers.current[key] = setTimeout(() => {
        onChange(key, value);
      }, 300);
    },
    [onChange],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  // Input styling per §9.5.3
  const inputClasses = [
    'w-full px-3 py-2',
    'border border-slate-200 rounded-lg',
    'text-sm text-slate-900',
    'placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    'transition-all duration-200',
    'disabled:bg-slate-100 disabled:cursor-not-allowed',
  ].join(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.colSpan ? `col-span-${field.colSpan}` : ''}
          >
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {field.label}
            </label>

            {field.type === 'text' && (
              <DebouncedTextInput
                value={String(values[field.key] ?? '')}
                placeholder={field.placeholder}
                className={inputClasses}
                onChange={(val) => handleTextChange(field.key, val)}
                onImmediateChange={(val) => onChange(field.key, val)}
                onKeyDown={handleKeyDown}
              />
            )}

            {field.type === 'select' && (
              <select
                value={String(values[field.key] ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`${inputClasses} bg-white`}
              >
                {field.options?.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'date' && (
              <input
                type="date"
                value={String(values[field.key] ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={inputClasses}
              />
            )}
          </div>
        ))}
      </div>

      {/* Action row */}
      {(showSearchButton || shouldShowClear || actions) && (
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
          {actions}
          {shouldShowClear && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
          {showSearchButton && (
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 inline-flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Debounced text input (keeps local state for immediate feedback)
// ---------------------------------------------------------------------------

interface DebouncedTextInputProps {
  value: string;
  placeholder?: string;
  className: string;
  onChange: (value: string) => void;
  onImmediateChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function DebouncedTextInput({
  value,
  placeholder,
  className,
  onChange,
  onKeyDown,
}: DebouncedTextInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const isInitialMount = useRef(true);

  // Sync external value changes (e.g. clear filters)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    onChange(newVal);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={localValue}
        placeholder={placeholder}
        className={`${className} pl-9`}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
