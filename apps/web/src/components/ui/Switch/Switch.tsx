'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { switchClasses } from './Switch.styles';

export interface SwitchProps {
  /** Estado encendido (controlado) */
  checked?: boolean;
  /** Estado inicial (no controlado) */
  defaultChecked?: boolean;
  /** Callback al cambiar */
  onChange?: (checked: boolean) => void;
  /** Etiqueta */
  label?: string;
  /** Texto de error */
  error?: string;
  /** Deshabilitar */
  disabled?: boolean;
  /** ID del input */
  id?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  error,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);

  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newChecked = e.target.checked;
    if (checked === undefined) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  return (
    <div className={className}>
      <label
        className={cn(
          switchClasses.root,
          disabled && switchClasses.rootDisabled
        )}
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className={switchClasses.input}
        />
        <span
          className={cn(
            switchClasses.track,
            isChecked && switchClasses.trackChecked,
            error && switchClasses.trackError,
            !disabled && switchClasses.trackFocus
          )}
        >
          <span
            className={cn(
              switchClasses.thumb,
              isChecked && switchClasses.thumbChecked
            )}
          />
        </span>
        {label && (
          <span className={cn(switchClasses.label, disabled && switchClasses.labelDisabled)}>
            {label}
          </span>
        )}
      </label>
      {error && <p className={switchClasses.error}>{error}</p>}
    </div>
  );
}
