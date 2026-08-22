import { cn } from '@/lib/utils';

export interface OverlayProps {
  children?: React.ReactNode;
  open?: boolean;
  blur?: boolean;
  dark?: boolean;
  /** Espacio a omitir en el lado izquierdo (ej. ancho del sidebar) */
  offsetLeft?: number;
  className?: string;
  onClick?: () => void;
}

export function Overlay({
  children,
  open = true,
  blur = false,
  dark = true,
  offsetLeft = 0,
  className,
  onClick,
}: OverlayProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'fixed top-0 bottom-0 left-0 right-0 z-40 flex items-center justify-center',
        dark ? 'bg-slate-900/50' : 'bg-white/50',
        blur && 'backdrop-blur-sm',
        className
      )}
      style={offsetLeft > 0 ? { left: offsetLeft } : undefined}
    >
      {children}
    </div>
  );
}
