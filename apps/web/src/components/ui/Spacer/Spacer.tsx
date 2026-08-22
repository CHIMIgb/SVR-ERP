import { cn } from '@/lib/utils';
import {
  spacerClasses,
  sizeMap,
  verticalSizeMap,
  horizontalSizeMap,
  type SpacerSize,
} from './Spacer.styles';

export interface SpacerProps {
  size?: SpacerSize;
  axis?: 'vertical' | 'horizontal' | 'both';
  className?: string;
}

export function Spacer({
  size = 'md',
  axis = 'vertical',
  className,
}: SpacerProps) {
  const sizeClass =
    axis === 'vertical'
      ? verticalSizeMap[size]
      : axis === 'horizontal'
      ? horizontalSizeMap[size]
      : sizeMap[size];

  return <div className={cn(spacerClasses.base, sizeClass, className)} aria-hidden="true" />;
}
