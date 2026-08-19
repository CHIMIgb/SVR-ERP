'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { inputClasses } from './Input.styles';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={inputClasses.wrapper}>
        {label && (
          <label htmlFor={inputId} className={inputClasses.label}>
            {label}
          </label>
        )}
        <div className={inputClasses.inputWrapper}>
          {icon && iconPosition === 'left' && (
            <span className={inputClasses.iconLeft}>{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputClasses.input,
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className={inputClasses.iconRight}>{icon}</span>
          )}
        </div>
        {error && <p className={inputClasses.error}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
