'use client';

import { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { dateRangePickerClasses } from './DateRangePicker.styles';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Rango seleccionado (controlado) */
  value?: DateRange;
  /** Rango inicial (no controlado) */
  defaultValue?: DateRange;
  /** Callback al cambiar el rango */
  onChange?: (range: DateRange) => void;
  /** Etiqueta del campo */
  label?: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Texto de error */
  error?: string;
  /** Deshabilitar el campo */
  disabled?: boolean;
  /** Fecha minima seleccionable */
  min?: Date;
  /** Fecha maxima seleccionable */
  max?: Date;
  /** Clase CSS adicional */
  className?: string;
}

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aa.getTime() < bb.getTime();
}

function isAfterDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aa.getTime() > bb.getTime();
}

function isBetweenDays(target: Date, start: Date, end: Date): boolean {
  return isAfterDay(target, start) && isBeforeDay(target, end);
}

function formatRange(range: DateRange): string {
  if (range.start && range.end) {
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  }
  if (range.start) {
    return `${formatDate(range.start)} - ...`;
  }
  return '';
}

function getCalendarDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const days: Date[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthDays - i));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Seleccionar rango',
  error,
  disabled = false,
  min,
  max,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<DateRange>(
    value ?? defaultValue ?? { start: null, end: null }
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const selectedRange = value ?? internalValue;

  const initialViewDate = selectedRange.start ?? new Date();
  const [viewDate, setViewDate] = useState(
    new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1)
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, []);

  // Calcular posición ANTES del paint
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reposicionar al hacer scroll/resize — ignorar scroll interno del dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = (e: Event) => {
      if (rootRef.current && e.target instanceof Node && rootRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  const isDateDisabled = (date: Date): boolean => {
    if (disabled) return true;
    if (min && isBeforeDay(date, min)) return true;
    if (max && isAfterDay(date, max)) return true;
    return false;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;

    const current = selectedRange;

    if (!current.start || (current.start && current.end)) {
      // Iniciar nuevo rango
      const newRange: DateRange = { start: date, end: null };
      setInternalValue(newRange);
      onChange?.(newRange);
      setHoverDate(null);
    } else {
      // Completar rango
      if (isBeforeDay(date, current.start)) {
        const newRange: DateRange = { start: date, end: current.start };
        setInternalValue(newRange);
        onChange?.(newRange);
      } else {
        const newRange: DateRange = { start: current.start, end: date };
        setInternalValue(newRange);
        onChange?.(newRange);
        setIsOpen(false);
      }
      setHoverDate(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRange: DateRange = { start: null, end: null };
    setInternalValue(newRange);
    onChange?.(newRange);
  };

  const navigateMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const calendarDays = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  const today = new Date();

  const getDayState = (date: Date) => {
    const isStart = selectedRange.start ? isSameDay(date, selectedRange.start) : false;
    const isEnd = selectedRange.end ? isSameDay(date, selectedRange.end) : false;
    const isSelected = isStart || isEnd;

    let isInRange = false;
    if (selectedRange.start && selectedRange.end) {
      isInRange = isBetweenDays(date, selectedRange.start, selectedRange.end);
    } else if (selectedRange.start && hoverDate) {
      isInRange = isBetweenDays(date, selectedRange.start, hoverDate);
    }

    return { isStart, isEnd, isSelected, isInRange };
  };

  return (
    <div ref={rootRef} className={cn(dateRangePickerClasses.root, className)}>
      {label && <label className={dateRangePickerClasses.label}>{label}</label>}

      <div
        ref={inputRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          dateRangePickerClasses.inputWrapper,
          error && dateRangePickerClasses.inputWrapperError,
          disabled && dateRangePickerClasses.inputWrapperDisabled
        )}
      >
        <input
          type="text"
          readOnly
          value={formatRange(selectedRange)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            dateRangePickerClasses.input,
            disabled && dateRangePickerClasses.inputDisabled
          )}
        />
        {(selectedRange.start || selectedRange.end) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={dateRangePickerClasses.clearButton}
            aria-label="Limpiar rango"
          >
            <X size={14} />
          </button>
        )}
        <Calendar className={dateRangePickerClasses.icon} size={18} />
      </div>

      {error && <p className={dateRangePickerClasses.error}>{error}</p>}

      {isOpen && !disabled && (
        <div
          className={dateRangePickerClasses.calendar}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
        >
          <div className={dateRangePickerClasses.calendarHeader}>
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className={dateRangePickerClasses.navButton}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={dateRangePickerClasses.calendarTitle}>
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className={dateRangePickerClasses.navButton}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={dateRangePickerClasses.daysHeader}>
            {WEEK_DAYS.map((day) => (
              <div key={day} className={dateRangePickerClasses.dayLabel}>
                {day}
              </div>
            ))}
          </div>

          <div className={dateRangePickerClasses.daysGrid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const { isStart, isEnd, isSelected, isInRange } = getDayState(date);
              const isToday = isSameDay(date, today);
              const isDisabled = isDateDisabled(date);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(date)}
                  onMouseEnter={() => setHoverDate(date)}
                  className={cn(
                    dateRangePickerClasses.dayButton,
                    !isCurrentMonth && dateRangePickerClasses.dayButtonOutside,
                    isToday && !isSelected && dateRangePickerClasses.dayButtonToday,
                    isSelected && dateRangePickerClasses.dayButtonSelected,
                    isInRange && !isSelected && dateRangePickerClasses.dayButtonInRange,
                    isStart && dateRangePickerClasses.dayButtonRangeStart,
                    isEnd && dateRangePickerClasses.dayButtonRangeEnd,
                    isDisabled && dateRangePickerClasses.dayButtonDisabled
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className={dateRangePickerClasses.footer}>
            <span className={dateRangePickerClasses.footerText}>
              {selectedRange.start && selectedRange.end
                ? `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`
                : selectedRange.start
                ? 'Selecciona fecha final'
                : 'Selecciona fecha inicial'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className={dateRangePickerClasses.footerClear}
            >
              Limpiar
            </button>
          </div>
          </div>
      )}
    </div>
  );
}
