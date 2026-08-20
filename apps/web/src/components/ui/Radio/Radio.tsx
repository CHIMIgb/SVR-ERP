'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { radioClasses } from './Radio.styles';

export interface RadioProps {
  /** Estado marcado (controlado) */
  checked?: boolean;
  /** Estado inicial (no controlado) */
  defaultChecked?: boolean;
  /** Callback al cambiar */
  onChange?: (checked: boolean) => void;
  /** Etiqueta */
  label?: string;
  /** Name del grupo de radios */
  name?: string;
  /** Value del radio */
  value?: string;
  /** Deshabilitar */
  disabled?: boolean;
  /** Indica si hay error en el grupo */
  error?: boolean;
  /** ID del input */
  id?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function Radio({
  checked,
  defaultChecked,
  onChange,
  label,
  name,
  value,
  disabled = false,
  error = false,
  id,
  className,
}: RadioProps) {
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
          radioClasses.root,
          disabled && radioClasses.rootDisabled
        )}
      >
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className={radioClasses.input}
        />
        <span
          className={cn(
            radioClasses.inputWrapper,
            isChecked && radioClasses.inputWrapperChecked,
            error && radioClasses.inputWrapperError,
            !disabled && radioClasses.inputWrapperFocus
          )}
        >
          {isChecked && <span className={radioClasses.dot} />}
        </span>
        {label && (
          <span className={cn(radioClasses.label, disabled && radioClasses.labelDisabled)}>
            {label}
          </span>
        )}
      </label>
    </div>
  );
}
