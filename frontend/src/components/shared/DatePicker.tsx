import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

function toDisplay(iso: string): string {
  if (!iso) return '';
  return iso.replace(/-/g, '/');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ value, onChange, placeholder = 'yyyy/mm/dd' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getViewDateFromValue = () => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [viewDate, setViewDate] = useState(getViewDateFromValue);

  const handleOpen = () => {
    setViewDate(getViewDateFromValue());
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    setViewDate((d) => {
      if (d.month === 0) return { year: d.year - 1, month: 11 };
      return { ...d, month: d.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate((d) => {
      if (d.month === 11) return { year: d.year + 1, month: 0 };
      return { ...d, month: d.month + 1 };
    });
  };

  const selectDay = (day: number) => {
    const m = String(viewDate.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewDate.year}-${m}-${d}`);
    setIsOpen(false);
  };

  const displayValue = toDisplay(value);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          readOnly
          onClick={handleOpen}
          className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
        />
      </div>

      {isOpen && (
        <div className="absolute mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-semibold text-slate-800">
              {MONTHS[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-[11px] font-medium text-slate-400 py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const m = String(viewDate.month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const isoDate = `${viewDate.year}-${m}-${d}`;
              const isSelected = value === isoDate;
              const isToday =
                new Date().getFullYear() === viewDate.year &&
                new Date().getMonth() === viewDate.month &&
                new Date().getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`text-sm py-1.5 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium'
                      : isToday
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear Button */}
          {value && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 transition-colors"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
