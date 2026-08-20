'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/Portal';
import { datePickerClasses } from './DatePicker.styles';

export interface DatePickerProps {
  /** Fecha seleccionada (controlado) */
  value?: Date | null;
  /** Fecha inicial (no controlado) */
  defaultValue?: Date | null;
  /** Callback al cambiar la fecha */
  onChange?: (date: Date | null) => void;
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
  /** Funcion para deshabilitar fechas especificas */
  disabledDates?: (date: Date) => boolean;
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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

export function DatePicker({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  error,
  disabled = false,
  min,
  max,
  disabledDates,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const initial = value ?? defaultValue ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const [internalValue, setInternalValue] = useState<Date | null>(
    value ?? defaultValue ?? null
  );

  const selectedDate = value !== undefined ? value : internalValue;
  const rootRef = useRef<HTMLDivElement>(null);

  // Calcular posición del dropdown
  const updatePosition = useCallback(() => {
    if (rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, []);

  // Cerrar al hacer click fuera
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

  // Recalcular posición al abrir y al hacer scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      if (disabled) return true;
      if (min && isBeforeDay(date, min)) return true;
      if (max && isAfterDay(date, max)) return true;
      if (disabledDates?.(date)) return true;
      return false;
    },
    [disabled, min, max, disabledDates]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      if (isDateDisabled(date)) return;
      setInternalValue(date);
      onChange?.(date);
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
      setIsOpen(false);
    },
    [isDateDisabled, onChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue(null);
    onChange?.(null);
  };

  const calendarDays = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  const today = new Date();

  const navigateMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  return (
    <div ref={rootRef} className={cn(datePickerClasses.root, className)}>
      {label && <label className={datePickerClasses.label}>{label}</label>}

      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          datePickerClasses.inputWrapper,
          error && datePickerClasses.inputWrapperError,
          disabled && datePickerClasses.inputWrapperDisabled
        )}
      >
        <input
          type="text"
          readOnly
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            datePickerClasses.input,
            disabled && datePickerClasses.inputDisabled
          )}
        />
        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={datePickerClasses.clearButton}
            aria-label="Limpiar fecha"
          >
            <X size={14} />
          </button>
        )}
        <Calendar className={datePickerClasses.icon} size={18} />
      </div>

      {error && <p className={datePickerClasses.error}>{error}</p>}

      {isOpen && !disabled && (
        <Portal>
          <div
            className={datePickerClasses.calendar}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          >
            <div className={datePickerClasses.calendarHeader}>
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className={datePickerClasses.navButton}
                aria-label="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className={datePickerClasses.calendarTitle}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className={datePickerClasses.navButton}
                aria-label="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={datePickerClasses.daysHeader}>
              {WEEK_DAYS.map((day) => (
                <div key={day} className={datePickerClasses.dayLabel}>
                  {day}
                </div>
              ))}
            </div>

            <div className={datePickerClasses.daysGrid}>
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isToday = isSameDay(date, today);
                const isDisabled = isDateDisabled(date);

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      datePickerClasses.dayButton,
                      !isCurrentMonth && datePickerClasses.dayButtonOutside,
                      isToday && !isSelected && datePickerClasses.dayButtonToday,
                      isSelected && datePickerClasses.dayButtonSelected,
                      isDisabled && datePickerClasses.dayButtonDisabled
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
