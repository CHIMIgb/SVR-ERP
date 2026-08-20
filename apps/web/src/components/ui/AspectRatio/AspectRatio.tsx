import { cn } from '@/lib/utils';
import {
  aspectRatioClasses,
  ratioToString,
  type AspectRatioValue,
} from './AspectRatio.styles';

export interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: AspectRatioValue;
  className?: string;
  contentClassName?: string;
  as?: 'div' | 'section' | 'article' | 'figure';
}

export function AspectRatio({
  children,
  ratio = 'video',
  className,
  contentClassName,
  as: Component = 'div',
}: AspectRatioProps) {
  return (
    <Component
      className={cn(aspectRatioClasses.base, className)}
      style={{ aspectRatio: ratioToString(ratio) }}
    >
      <div
        className={cn(
          'w-full h-full flex items-center justify-center',
          contentClassName
        )}
      >
        {children}
      </div>
    </Component>
  );
}
