import { cn } from '@/lib/utils';

export interface OverlayProps {
  children?: React.ReactNode;
  open?: boolean;
  blur?: boolean;
  dark?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Overlay({
  children,
  open = true,
  blur = false,
  dark = true,
  className,
  onClick,
}: OverlayProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'fixed inset-0 z-40 flex items-center justify-center',
        dark ? 'bg-slate-900/50' : 'bg-white/50',
        blur && 'backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
