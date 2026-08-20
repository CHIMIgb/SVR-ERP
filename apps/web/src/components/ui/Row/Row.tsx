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

export interface RowProps {
  children: React.ReactNode;
  wrap?: FlexWrap;
  justify?: FlexJustify;
  align?: FlexAlign;
  gap?: FlexGap;
  inline?: boolean;
  fullWidth?: boolean;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article' | 'header' | 'footer' | 'main' | 'nav' | 'ul' | 'ol';
}

export function Row({
  children,
  wrap = 'nowrap',
  justify,
  align = 'center',
  gap = 'md',
  inline = false,
  fullWidth = false,
  className,
  as: Component = 'div',
}: RowProps) {
  return (
    <Component
      className={cn(
        inline ? flexClasses.inline : flexClasses.base,
        'flex-row',
        wrapMap[wrap],
        gapMap[gap],
        justify && justifyMap[justify],
        alignMap[align],
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
