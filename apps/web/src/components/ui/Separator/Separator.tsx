import { cn } from '@/lib/utils';
import {
  separatorClasses,
  horizontalThicknessMap,
  verticalThicknessMap,
  type SeparatorOrientation,
  type SeparatorSize,
} from './Separator.styles';

export interface SeparatorProps {
  orientation?: SeparatorOrientation;
  size?: SeparatorSize;
  decorative?: boolean;
  className?: string;
}

export function Separator({
  orientation = 'horizontal',
  size = 'thin',
  decorative = true,
  className,
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        separatorClasses.base,
        orientation === 'horizontal'
          ? `${separatorClasses.horizontal} ${horizontalThicknessMap[size]}`
          : `${separatorClasses.vertical} ${verticalThicknessMap[size]}`,
        className
      )}
    />
  );
}
