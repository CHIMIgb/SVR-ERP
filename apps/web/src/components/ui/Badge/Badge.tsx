import { cn } from '@/lib/utils';
import { badgeClasses } from './Badge.styles';

export type BadgeVariant = keyof typeof badgeClasses.variants;
export type BadgeSize = keyof typeof badgeClasses.sizes;

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeClasses.base,
        badgeClasses.sizes[size],
        badgeClasses.variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 shrink-0',
            badgeClasses.dots[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
