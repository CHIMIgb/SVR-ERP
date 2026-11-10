'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClasses } from './Button.styles';

export type ButtonVariant = keyof typeof buttonClasses.variants;
export type ButtonSize = keyof typeof buttonClasses.sizes;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Placeholder de carga: barra con el tamaño del botón, sin texto ni click. */
  skeleton?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      skeleton = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Barra de contraste sobre el bg del botón (ui-* se invierte en oscuro).
    const skeletonBar = (
      <span className="block h-4 w-24 rounded bg-ui-300/70 dark:bg-ui-600/40 animate-pulse" />
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading || skeleton}
        className={cn(
          buttonClasses.base,
          buttonClasses.variants[variant],
          buttonClasses.sizes[size],
          (disabled || loading) && buttonClasses.disabled,
          loading && buttonClasses.loading,
          fullWidth && 'w-full',
          className
        )}
        {...props}
        onClick={skeleton ? undefined : props.onClick}
        aria-busy={skeleton ? true : undefined}
      >
        {skeleton ? (
          skeletonBar
        ) : (
          <>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!loading && icon && iconPosition === 'left' && (
              <span className="shrink-0">{icon}</span>
            )}
            {children && <span className="truncate">{children}</span>}
            {!loading && icon && iconPosition === 'right' && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
