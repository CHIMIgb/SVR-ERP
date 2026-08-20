import { cn } from '@/lib/utils';
import {
  flexClasses,
  wrapMap,
  justifyMap,
  alignMap,
  gapMap,
  type FlexWrap,
  type FlexJustify,
  type FlexAlign,
  type FlexGap,
} from '../Flex/Flex.styles';

export interface ColumnProps {
  children: React.ReactNode;
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

export function Column({
  children,
  wrap = 'nowrap',
  justify,
  align = 'stretch',
  gap = 'md',
  inline = false,
  fullWidth = false,
  fullHeight = false,
  className,
  as: Component = 'div',
}: ColumnProps) {
  return (
    <Component
      className={cn(
        inline ? flexClasses.inline : flexClasses.base,
        'flex-col',
        wrapMap[wrap],
        gapMap[gap],
        justify && justifyMap[justify],
        alignMap[align],
        fullWidth && 'w-full',
        fullHeight && 'h-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
