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

function generateHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
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
  const listHourRef = useRef<HTMLDivElement>(null);
  const listMinuteRef = useRef<HTMLDivElement>(null);

  const currentTime = value !== undefined ? value : internalValue;
  const parsed = parseTime(currentTime);

  const hours = generateHours();
  const minutes = generateMinutes(minuteStep);

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  // useLayoutEffect: calcula posición ANTES del paint (sin parpadeo)
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Click outside
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

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Reposicionar al scroll/resize — ignorar scroll interno del dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = (e: Event) => {
      // Si el scroll viene de dentro del dropdown, no reposicionar
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

  // Auto-scroll a la hora seleccionada
  useEffect(() => {
    if (!isOpen || !parsed) return;
    requestAnimationFrame(() => {
      if (listHourRef.current) {
        const active = listHourRef.current.querySelector('[data-active]');
        active?.scrollIntoView({ block: 'center' });
      }
      if (listMinuteRef.current) {
        const active = listMinuteRef.current.querySelector('[data-active]');
        active?.scrollIntoView({ block: 'center' });
      }
    });
  }, [isOpen, parsed]);

  const handleSelect = useCallback(
    (hours: number, minutes: number) => {
      const time = formatTime(hours, minutes);
      if (value === undefined) setInternalValue(time);
      onChange?.(time);
      setIsOpen(false);
    },
    [value, onChange]
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    const time = formatTime(now.getHours(), Math.floor(now.getMinutes() / minuteStep) * minuteStep);
    if (value === undefined) setInternalValue(time);
    onChange?.(time);
    setIsOpen(false);
  }, [value, onChange, minuteStep]);

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
          <div className="flex gap-3">
            {/* Horas */}
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                Hora
              </div>
              <div ref={listHourRef} className="tp-scroll-list">
                {hours.map((h) => {
                  const time = formatTime(h, parsed?.minutes ?? 0);
                  const disabledOption = isTimeDisabled(time, min, max);
                  const isActive = parsed?.hours === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={isActive || undefined}
                      disabled={disabledOption}
                      onClick={() => handleSelect(h, parsed?.minutes ?? 0)}
                      className={cn(
                        'w-full text-center text-sm font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 text-slate-700',
                        isActive && 'bg-primary text-white hover:bg-primary-dark',
                        disabledOption && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-lg font-bold text-slate-300 self-center pt-5">:</span>

            {/* Minutos */}
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                Min
              </div>
              <div ref={listMinuteRef} className="tp-scroll-list">
                {minutes.map((m) => {
                  const time = formatTime(parsed?.hours ?? 0, m);
                  const disabledOption = isTimeDisabled(time, min, max);
                  const isActive = parsed?.minutes === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={isActive || undefined}
                      disabled={disabledOption}
                      onClick={() => handleSelect(parsed?.hours ?? 0, m)}
                      className={cn(
                        'w-full text-center text-sm font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 text-slate-700',
                        isActive && 'bg-primary text-white hover:bg-primary-dark',
                        disabledOption && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
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
