'use client';

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimePickerProps {
  /** Hora seleccionada (controlado) — formato "HH:mm" */
  value?: string;
  /** Hora inicial (no controlado) */
  defaultValue?: string;
  /** Callback al cambiar */
  onChange?: (time: string) => void;
  /** Etiqueta */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Placeholder */
  placeholder?: string;
  /** Hora minima permitida — formato "HH:mm" */
  min?: string;
  /** Hora maxima permitida — formato "HH:mm" */
  max?: string;
  /** Intervalo de minutos (5, 10, 15, 30) */
  minuteStep?: number;
  /** Deshabilitar */
  disabled?: boolean;
  /** ID del input */
  id?: string;
  /** Clase CSS adicional */
  className?: string;
}

function parseTime(time: string): { hours: number; minutes: number } | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return { hours: h, minutes: m };
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function generateMinutes(step: number): number[] {
  const minutes: number[] = [];
  for (let i = 0; i < 60; i += step) {
    minutes.push(i);
  }
  return minutes;
}

function isTimeDisabled(time: string, min?: string, max?: string): boolean {
  if (!min && !max) return false;
  if (min && time < min) return true;
  if (max && time > max) return true;
  return false;
}

const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

function to12Hour(h24: number): { hour12: number; period: Period } {
  const period: Period = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour12, period };
}

function to24Hour(hour12: number, period: Period): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function TimePicker({
  value,
  defaultValue,
  onChange,
  label,
  error,
  placeholder = 'Seleccionar hora',
  min,
  max,
  minuteStep = 5,
  disabled = false,
  id,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const currentTime = value !== undefined ? value : internalValue;
  const parsed = parseTime(currentTime);

  // Derived state for the grid
  const { hour12, period } = parsed ? to12Hour(parsed.hours) : { hour12: 12 as number, period: 'AM' as Period };
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);
  const [selectedHour12, setSelectedHour12] = useState<number | null>(parsed ? hour12 : null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(parsed?.minutes ?? null);

  const minutes = generateMinutes(minuteStep);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  // Sync with external value changes
  useEffect(() => {
    if (parsed) {
      const { hour12: h12, period: p } = to12Hour(parsed.hours);
      setSelectedHour12(h12);
      setSelectedPeriod(p);
      setSelectedMinute(parsed.minutes);
    }
  }, [parsed]);

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  const commitSelection = useCallback(
    (h12: number, m: number, p: Period) => {
      const h24 = to24Hour(h12, p);
      const time = formatTime(h24, m);
      if (value === undefined) setInternalValue(time);
      onChange?.(time);
      setIsOpen(false);
    },
    [value, onChange]
  );

  const handleHourClick = useCallback(
    (h12: number) => {
      setSelectedHour12(h12);
      if (selectedMinute !== null) {
        commitSelection(h12, selectedMinute, selectedPeriod);
      }
    },
    [selectedMinute, selectedPeriod, commitSelection]
  );

  const handleMinuteClick = useCallback(
    (m: number) => {
      setSelectedMinute(m);
      if (selectedHour12 !== null) {
        commitSelection(selectedHour12, m, selectedPeriod);
      }
    },
    [selectedHour12, selectedPeriod, commitSelection]
  );

  const handlePeriodClick = useCallback(
    (p: Period) => {
      setSelectedPeriod(p);
      if (selectedHour12 !== null && selectedMinute !== null) {
        commitSelection(selectedHour12, selectedMinute, p);
      }
    },
    [selectedHour12, selectedMinute, commitSelection]
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    const h = now.getHours();
    const m = Math.floor(now.getMinutes() / minuteStep) * minuteStep;
    const { hour12: h12, period: p } = to12Hour(h);
    setSelectedHour12(h12);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    commitSelection(h12, m, p);
  }, [minuteStep, commitSelection]);

  const handleClear = useCallback(() => {
    if (value === undefined) setInternalValue('');
    onChange?.('');
    setIsOpen(false);
  }, [value, onChange]);

  return (
    <div ref={rootRef} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}

      <div ref={inputRef} className="relative flex items-center">
        <input
          id={inputId}
          type="text"
          readOnly
          value={currentTime}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full h-10 sm:h-11 px-3 sm:px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-100'
          )}
        />
        <Clock className="absolute right-3 text-slate-400 pointer-events-none" size={16} />
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      {isOpen && (
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-[280px] pointer-events-auto"
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 60 }}
        >
          {/* Hora 12h + Periodo */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                Hora
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                  const isActive = selectedHour12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourClick(h)}
                      className={cn(
                        'h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-1 pt-5">
              {PERIODS.map((p) => {
                const isActive = selectedPeriod === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodClick(p)}
                    className={cn(
                      'w-10 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutos */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              Minutos
            </div>
            <div className="grid grid-cols-6 gap-1">
              {minutes.map((m) => {
                const isActive = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteClick(m)}
                    className={cn(
                      'h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNow}
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
            >
              Ahora
            </button>
            {currentTime && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
