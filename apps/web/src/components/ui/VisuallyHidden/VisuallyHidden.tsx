import { cn } from '@/lib/utils';
import { visuallyHiddenClasses } from './VisuallyHidden.styles';

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'label';
  focusable?: boolean;
}

export function VisuallyHidden({
  children,
  className,
  as: Component = 'span',
  focusable = false,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        visuallyHiddenClasses,
        focusable &&
          'focus:absolute focus:z-50 focus:w-auto focus:h-auto focus:p-2 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:bg-surface focus:text-ui-900 focus:shadow-lg focus:rounded-md focus:border focus:border-ui-200',
        className
      )}
    >
      {children}
    </Component>
  );
}
