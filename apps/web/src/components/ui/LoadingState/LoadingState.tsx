import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadingStateClasses } from './LoadingState.styles';

export interface LoadingStateProps {
  /** Texto que se muestra junto al spinner */
  text?: string;
  /** Tamanio del spinner: sm (20px), md (32px), lg (48px) */
  size?: 'sm' | 'md' | 'lg';
  /** Clase CSS adicional */
  className?: string;
}

const sizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function LoadingState({
  text = 'Cargando...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn(loadingStateClasses.wrapper, className)}>
      <div className={loadingStateClasses.spinnerWrapper}>
        <Loader2
          className={cn(loadingStateClasses.spinner, loadingStateClasses.spinnerSizes[size])}
          size={sizeMap[size]}
        />
      </div>
      {text && <p className={cn(loadingStateClasses.text, loadingStateClasses.textSizes[size])}>{text}</p>}
    </div>
  );
}
