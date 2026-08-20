import { cn } from '@/lib/utils';
import {
  skeletonTextClasses,
  getLineWidth,
  type SkeletonTextWidth,
} from './SkeletonText.styles';

export interface SkeletonTextProps {
  /** Numero de lineas a renderizar */
  lines?: number;
  /** Ancho de las lineas: 'full', 'random', o array de clases Tailwind */
  width?: SkeletonTextWidth;
  /** Ancho de la ultima linea (opcional) */
  lastLineWidth?: string;
  /** Variante visual */
  variant?: 'text' | 'title';
  /** Espaciado entre lineas */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  /** Desactivar animacion */
  noAnimation?: boolean;
  className?: string;
}

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

export function SkeletonText({
  lines = 3,
  width = 'full',
  lastLineWidth,
  variant = 'text',
  gap = 'md',
  noAnimation = false,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col', gapMap[gap], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonTextClasses.base,
            variant === 'title' ? skeletonTextClasses.title : skeletonTextClasses.line,
            getLineWidth(width, i, lines, lastLineWidth),
            noAnimation && 'animate-none'
          )}
        />
      ))}
    </div>
  );
}
