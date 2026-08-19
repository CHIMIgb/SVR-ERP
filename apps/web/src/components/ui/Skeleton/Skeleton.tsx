import { cn } from '@/lib/utils';
import { skeletonClasses } from './Skeleton.styles';

export interface SkeletonProps {
  /** Numero de lineas a renderizar */
  lines?: number;
  /** Variante visual */
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'row' | 'table';
  /** Ancho personalizado (Tailwind class, ej. 'w-32') */
  width?: string;
  /** Alto personalizado (Tailwind class, ej. 'h-6') */
  height?: string;
  /** Clase CSS adicional */
  className?: string;
}

export function Skeleton({
  lines = 1,
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  if (variant === 'avatar') {
    return (
      <div
        className={cn(skeletonClasses.base, skeletonClasses.rounded, width || 'w-10', height || 'h-10', className)}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(skeletonClasses.card, className)}>
        <div className={skeletonClasses.cardHeader}>
          <div className={cn(skeletonClasses.base, 'w-10 h-10 rounded-xl')} />
          <div className="flex-1 space-y-2">
            <div className={cn(skeletonClasses.base, 'w-24 h-3')} />
            <div className={cn(skeletonClasses.base, 'w-16 h-5')} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={cn(skeletonClasses.row, className)}>
        <div className={cn(skeletonClasses.base, 'w-8 h-8 rounded-lg')} />
        <div className="flex-1 space-y-2">
          <div className={cn(skeletonClasses.base, 'w-40 h-3')} />
          <div className={cn(skeletonClasses.base, 'w-24 h-2.5')} />
        </div>
        <div className={cn(skeletonClasses.base, 'w-16 h-6 rounded-full')} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn(skeletonClasses.table, className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={skeletonClasses.tableRow}>
            <div className={cn(skeletonClasses.base, 'w-32 h-3')} />
            <div className={cn(skeletonClasses.base, 'w-24 h-3')} />
            <div className={cn(skeletonClasses.base, 'w-20 h-3')} />
            <div className={cn(skeletonClasses.base, 'w-16 h-3')} />
          </div>
        ))}
      </div>
    );
  }

  // variant: 'text' | 'title'
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonClasses.base,
            variant === 'title' ? 'h-5 w-3/4' : 'h-3',
            i === lines - 1 && 'w-2/3'
          )}
          style={width ? { width } : undefined}
        />
      ))}
    </div>
  );
}
