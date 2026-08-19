'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectClasses } from './Select.styles';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder = 'Seleccionar...', className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={selectClasses.wrapper}>
        {label && (
          <label htmlFor={selectId} className={selectClasses.label}>
            {label}
          </label>
        )}
        <div className={selectClasses.selectWrapper}>
          <select
            ref={ref}
            id={selectId}
            className={cn(
              selectClasses.select,
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={selectClasses.chevron} size={16} />
        </div>
        {error && <p className={selectClasses.error}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
