'use client';

import { cn } from '@/lib/utils';

type StackSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type StackDirection = 'vertical' | 'horizontal';

const gapMap: Record<StackSize, string> = {
  none: 'gap-0',
  xs: 'gap-1',    /* 4px */
  sm: 'gap-2',    /* 8px */
  md: 'gap-4',    /* 16px */
  lg: 'gap-6',    /* 24px */
  xl: 'gap-8',    /* 32px */
};

export interface StackProps {
  children: React.ReactNode;
  direction?: StackDirection;
  gap?: StackSize;
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'nav' | 'ul' | 'ol';
}

export function Stack({
  children,
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  wrap = false,
  className,
  as: Tag = 'div',
}: StackProps) {
  return (
    <Tag
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        gapMap[gap],
        {
          'items-start': align === 'start',
          'items-center': align === 'center',
          'items-end': align === 'end',
          'items-stretch': align === 'stretch',
          'flex-wrap': wrap,
        },
        className
      )}
    >
      {children}
    </Tag>
  );
}
