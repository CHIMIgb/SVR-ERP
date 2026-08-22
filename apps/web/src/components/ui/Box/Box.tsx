import { cn } from '@/lib/utils';
import {
  boxClasses,
  paddingMap,
  radiusMap,
  shadowMap,
  backgroundMap,
  borderMap,
  type BoxPadding,
  type BoxRadius,
  type BoxShadow,
  type BoxBackground,
  type BoxBorder,
} from './Box.styles';

export interface BoxProps {
  children: React.ReactNode;
  padding?: BoxPadding;
  radius?: BoxRadius;
  shadow?: BoxShadow;
  background?: BoxBackground;
  border?: BoxBorder;
  fullWidth?: boolean;
  fullHeight?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'header' | 'footer' | 'main' | 'aside' | 'span';
}

export function Box({
  children,
  padding = 'none',
  radius = 'none',
  shadow = 'none',
  background = 'transparent',
  border = 'none',
  fullWidth = false,
  fullHeight = false,
  className,
  as: Component = 'div',
}: BoxProps) {
  return (
    <Component
      className={cn(
        boxClasses.base,
        paddingMap[padding],
        radiusMap[radius],
        shadowMap[shadow],
        backgroundMap[background],
        borderMap[border],
        fullWidth && 'w-full',
        fullHeight && 'h-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
