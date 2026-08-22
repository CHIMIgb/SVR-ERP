import { cn } from '@/lib/utils';
import {
  scrollAreaClasses,
  paddingMap,
  type ScrollAreaOrientation,
  type ScrollAreaSize,
} from './ScrollArea.styles';

export interface ScrollAreaProps {
  children: React.ReactNode;
  orientation?: ScrollAreaOrientation;
  maxHeight?: string;
  maxWidth?: string;
  padding?: ScrollAreaSize;
  hideScrollbar?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

const orientationMap: Record<ScrollAreaOrientation, string> = {
  horizontal: scrollAreaClasses.horizontal,
  vertical: scrollAreaClasses.vertical,
  both: scrollAreaClasses.both,
};

export function ScrollArea({
  children,
  orientation = 'vertical',
  maxHeight,
  maxWidth,
  padding = 'none',
  hideScrollbar = false,
  className,
  as: Component = 'div',
}: ScrollAreaProps) {
  return (
    <Component
      className={cn(
        orientationMap[orientation],
        paddingMap[padding],
        hideScrollbar && scrollAreaClasses.hiddenScrollbar,
        className
      )}
      style={{
        maxHeight,
        maxWidth,
      }}
    >
      {children}
    </Component>
  );
}
