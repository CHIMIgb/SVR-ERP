'use client';

import { cn } from '@/lib/utils';

type DividerVariant = 'solid' | 'dashed' | 'dotted';
type DividerSpacing = 'none' | 'sm' | 'md' | 'lg';

const spacingMap: Record<DividerSpacing, string> = {
  none: 'my-0',
  sm: 'my-3',   /* 12px */
  md: 'my-5',   /* 20px */
  lg: 'my-8',   /* 32px */
};

export interface DividerProps {
  variant?: DividerVariant;
  spacing?: DividerSpacing;
  label?: string;
  className?: string;
}

export function Divider({
  variant = 'solid',
  spacing = 'md',
  label,
  className,
}: DividerProps) {
  const borderStyle: Record<DividerVariant, string> = {
    solid: 'border-slate-200',
    dashed: 'border-slate-200 border-dashed',
    dotted: 'border-slate-300 border-dotted',
  };

  if (label) {
    return (
      <div className={cn('flex items-center gap-4', spacingMap[spacing], className)}>
        <div className={cn('flex-1 border-t', borderStyle[variant])} />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
        <div className={cn('flex-1 border-t', borderStyle[variant])} />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        'border-t',
        borderStyle[variant],
        spacingMap[spacing],
        className
      )}
    />
  );
}
