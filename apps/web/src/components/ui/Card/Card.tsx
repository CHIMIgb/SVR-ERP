'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cardClasses } from './Card.styles';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof cardClasses.padding;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', interactive = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardClasses.base,
          cardClasses.padding[padding],
          interactive && cardClasses.interactive,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
