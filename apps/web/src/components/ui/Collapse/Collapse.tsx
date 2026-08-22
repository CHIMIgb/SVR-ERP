import { cn } from '@/lib/utils';
import { collapseClasses } from './Collapse.styles';

export interface CollapseProps {
  children: React.ReactNode;
  in?: boolean;
  className?: string;
  innerClassName?: string;
}

export function Collapse({
  children,
  in: isOpen = false,
  className,
  innerClassName,
}: CollapseProps) {
  return (
    <div
      className={cn(
        collapseClasses.base,
        isOpen ? collapseClasses.open : collapseClasses.closed,
        className
      )}
    >
      <div className={cn(collapseClasses.inner, innerClassName)}>
        {children}
      </div>
    </div>
  );
}
