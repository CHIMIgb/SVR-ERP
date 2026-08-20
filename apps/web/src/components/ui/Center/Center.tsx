import { cn } from '@/lib/utils';
import { centerClasses, axisMap, type CenterAxis } from './Center.styles';

export interface CenterProps {
  children: React.ReactNode;
  axis?: CenterAxis;
  inline?: boolean;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article' | 'main' | 'header' | 'footer';
}

export function Center({
  children,
  axis = 'both',
  inline = false,
  className,
  as: Component = inline ? 'span' : 'div',
}: CenterProps) {
  return (
    <Component
      className={cn(
        inline ? centerClasses.inline : centerClasses.base,
        axisMap[axis],
        className
      )}
    >
      {children}
    </Component>
  );
}
