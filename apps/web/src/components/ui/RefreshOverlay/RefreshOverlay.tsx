import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { refreshOverlayClasses } from './RefreshOverlay.styles';

export interface RefreshOverlayProps {
  /** Mostrar el overlay (true durante refetches con datos previos en pantalla) */
  show?: boolean;
  /** Clase CSS adicional sobre el contenedor */
  className?: string;
}

/**
 * Overlay translúcido sobre el contenedor `relative` padre — indica que un
 * refetch está en curso SIN mover el contenido previo. Renderiza `null`
 * cuando `show` es false, así que basta siempre-renderizarlo.
 */
export function RefreshOverlay({ show = false, className }: RefreshOverlayProps) {
  if (!show) return null;
  return (
    <div className={cn(refreshOverlayClasses.base, className)}>
      <Loader2 className={refreshOverlayClasses.spinner} />
    </div>
  );
}
