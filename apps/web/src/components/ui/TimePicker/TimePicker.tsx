'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timePickerClasses } from './TimePicker.styles';

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
  const listHourRef = useRef<HTMLDivElement>(null);
  const listMinuteRef = useRef<HTMLDivElement>(null);

  const currentTime = value !== undefined ? value : internalValue;
  const parsed = parseTime(currentTime);

  const hours = generateHours();
  const minutes = generateMinutes(minuteStep);

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

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
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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

  // Auto-scroll a la hora seleccionada al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (parsed) {
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
    }
  }, [isOpen, parsed]);

  const handleSelect = useCallback(
    (hours: number, minutes: number) => {
      const time = formatTime(hours, minutes);
      if (value === undefined) {
        setInternalValue(time);
      }
      onChange?.(time);
      setIsOpen(false);
    },
    [value, onChange]
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    const time = formatTime(now.getHours(), Math.floor(now.getMinutes() / minuteStep) * minuteStep);
    if (value === undefined) {
      setInternalValue(time);
    }
    onChange?.(time);
    setIsOpen(false);
  }, [value, onChange, minuteStep]);

  const handleClear = useCallback(() => {
    if (value === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    setIsOpen(false);
  }, [value, onChange]);

  return (
    <div ref={rootRef} className={cn(timePickerClasses.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={timePickerClasses.label}>
          {label}
        </label>
      )}

      <div className={timePickerClasses.inputWrapper}>
        <input
          id={inputId}
          type="text"
          readOnly
          value={currentTime}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            timePickerClasses.input,
            error && timePickerClasses.inputError,
            'cursor-pointer'
          )}
        />
        <Clock className={timePickerClasses.iconRight} size={16} />
      </div>

      {error && <p className={timePickerClasses.error}>{error}</p>}

      {isOpen && (
        <div
          className={timePickerClasses.dropdown}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
        >
            <div className={timePickerClasses.columns}>
              {/* Horas */}
              <div className={timePickerClasses.column}>
                <div className={timePickerClasses.columnHeader}>Hora</div>
                <div ref={listHourRef} className={timePickerClasses.list}>
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
                          timePickerClasses.option,
                          isActive && timePickerClasses.optionActive,
                          disabledOption && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span className={timePickerClasses.separator}>:</span>

              {/* Minutos */}
              <div className={timePickerClasses.column}>
                <div className={timePickerClasses.columnHeader}>Min</div>
                <div ref={listMinuteRef} className={timePickerClasses.list}>
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
                          timePickerClasses.option,
                          isActive && timePickerClasses.optionActive,
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

            <div className={timePickerClasses.footer}>
              <button
                type="button"
                onClick={handleNow}
                className={timePickerClasses.nowButton}
              >
                Ahora
              </button>
              {currentTime && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={timePickerClasses.clearButton}
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
