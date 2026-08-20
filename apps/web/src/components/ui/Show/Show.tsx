import { cn } from '@/lib/utils';
import { showMap, type Breakpoint } from './Show.styles';

export interface ShowProps {
  children: React.ReactNode;
  above?: Breakpoint;
  below?: Breakpoint;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article';
}

export function Show({
  children,
  above,
  below,
  className,
  as: Component = 'div',
}: ShowProps) {
  let visibilityClass = '';

  if (above) {
    visibilityClass = showMap[above];
  }

  if (below) {
    const belowMap: Record<Breakpoint, string> = {
      sm: 'block sm:hidden',
      md: 'block md:hidden',
      lg: 'block lg:hidden',
      xl: 'block xl:hidden',
    };
    visibilityClass = belowMap[below];
  }

  return (
    <Component className={cn(visibilityClass, className)}>
      {children}
    </Component>
  );
}
