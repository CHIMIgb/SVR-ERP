import { cn } from '@/lib/utils';
import { type Breakpoint } from '../Show/Show.styles';

export interface HideProps {
  children: React.ReactNode;
  above?: Breakpoint;
  below?: Breakpoint;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article';
}

const hideAboveMap: Record<Breakpoint, string> = {
  sm: 'block sm:hidden',
  md: 'block md:hidden',
  lg: 'block lg:hidden',
  xl: 'block xl:hidden',
};

const hideBelowMap: Record<Breakpoint, string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
};

export function Hide({
  children,
  above,
  below,
  className,
  as: Component = 'div',
}: HideProps) {
  const visibilityClass = above ? hideAboveMap[above] : below ? hideBelowMap[below] : '';

  return (
    <Component className={cn(visibilityClass, className)}>
      {children}
    </Component>
  );
}
