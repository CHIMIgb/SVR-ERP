'use client';

import { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { textareaClasses } from './Textarea.styles';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Etiqueta del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Auto-ajustar altura al escribir */
  autoResize?: boolean;
  /** Mostrar contador de caracteres */
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      autoResize = false,
      showCounter = false,
      className,
      id,
      maxLength,
      value,
      onChange,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleInput = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          const el = e.target;
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }
        onChange?.(e);
      },
      [autoResize, onChange]
    );

    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={textareaClasses.wrapper}>
        {label && (
          <label htmlFor={textareaId} className={textareaClasses.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={handleInput}
          className={cn(
            textareaClasses.textarea,
            error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error && <p className={textareaClasses.error}>{error}</p>}
          {showCounter && maxLength && (
            <p className={cn(textareaClasses.counter, error && 'ml-auto')}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
