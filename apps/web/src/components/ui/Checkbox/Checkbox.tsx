'use client';

import { useRef, useEffect, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkboxClasses } from './Checkbox.styles';

export interface CheckboxProps {
  /** Estado marcado (controlado) */
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
  /** Estado indeterminado */
  indeterminate?: boolean;
  /** ID del input */
  id?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  error,
  disabled = false,
  indeterminate = false,
  id,
  className,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);

  const isChecked = checked !== undefined ? checked : internalChecked;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

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
          checkboxClasses.root,
          disabled && checkboxClasses.rootDisabled
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className={checkboxClasses.input}
        />
        <span
          className={cn(
            checkboxClasses.inputWrapper,
            isChecked && checkboxClasses.inputWrapperChecked,
            error && checkboxClasses.inputWrapperError,
            !disabled && checkboxClasses.inputWrapperFocus
          )}
        >
          {indeterminate ? (
            <Minus className={checkboxClasses.indeterminateIcon} strokeWidth={3} />
          ) : isChecked ? (
            <Check className={checkboxClasses.checkIcon} strokeWidth={3} />
          ) : null}
        </span>
        {label && (
          <span className={cn(checkboxClasses.label, disabled && checkboxClasses.labelDisabled)}>
            {label}
          </span>
        )}
      </label>
      {error && <p className={checkboxClasses.error}>{error}</p>}
    </div>
  );
}
