import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Center } from '@/components/ui/Center';
import { Stack } from '@/components/ui/Stack';
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
    <Center axis="both" className={cn('py-16 px-4', className)}>
      <Stack gap="sm" align="center">
        <Loader2
          className={cn(loadingStateClasses.spinner, loadingStateClasses.spinnerSizes[size])}
          size={sizeMap[size]}
        />
        {text && <p className={cn(loadingStateClasses.text, loadingStateClasses.textSizes[size])}>{text}</p>}
      </Stack>
    </Center>
  );
}
