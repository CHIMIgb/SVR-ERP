import { cn } from '@/lib/utils';
import {
  flexClasses,
  directionMap,
  wrapMap,
  justifyMap,
  alignMap,
  gapMap,
  type FlexDirection,
  type FlexWrap,
  type FlexJustify,
  type FlexAlign,
  type FlexGap,
} from './Flex.styles';

export interface FlexProps {
  children: React.ReactNode;
  direction?: FlexDirection;
  wrap?: FlexWrap;
  justify?: FlexJustify;
  align?: FlexAlign;
  gap?: FlexGap;
  inline?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article' | 'header' | 'footer' | 'main' | 'nav' | 'ul' | 'ol';
}

export function Flex({
  children,
  direction = 'row',
  wrap = 'nowrap',
  justify,
  align,
  gap = 'md',
  inline = false,
  fullWidth = false,
  fullHeight = false,
  className,
  as: Component = 'div',
}: FlexProps) {
  return (
    <Component
      className={cn(
        inline ? flexClasses.inline : flexClasses.base,
        directionMap[direction],
        wrapMap[wrap],
        gapMap[gap],
        justify && justifyMap[justify],
        align && alignMap[align],
        fullWidth && 'w-full',
        fullHeight && 'h-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
