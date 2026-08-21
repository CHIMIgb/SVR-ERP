'use client';

import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import { cn } from '@/lib/utils';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Texto o contenido del tooltip */
  content: React.ReactNode;
  /** Posición preferida */
  placement?: TooltipPlacement;
  /** Retraso en ms antes de mostrar (solo hover) */
  delay?: number;
  /** Ancho maximo del tooltip */
  maxWidth?: number;
  /** Deshabilitar el tooltip */
  disabled?: boolean;
  /** Elemento trigger */
  children: React.ReactElement;
  /** Clase adicional en el wrapper */
  className?: string;
}

const GAP = 8; // px entre trigger y tooltip

/**
 * Calcula posición del tooltip usando fixed positioning.
 * Auto-flip si no cabe en el viewport.
 */
function calcPosition(
  triggerRect: DOMRect,
  tooltipEl: HTMLDivElement,
  placement: TooltipPlacement,
  gap: number
): { top: number; left: number; finalPlacement: TooltipPlacement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;

  let top = 0;
  let left = 0;
  let finalPlacement = placement;

  // Intentar la posición preferida
  const tryPlacement = (p: TooltipPlacement) => {
    switch (p) {
      case 'top':
        return {
          top: triggerRect.top - th - gap,
          left: triggerRect.left + triggerRect.width / 2 - tw / 2,
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + gap,
          left: triggerRect.left + triggerRect.width / 2 - tw / 2,
        };
      case 'left':
        return {
          top: triggerRect.top + triggerRect.height / 2 - th / 2,
          left: triggerRect.left - tw - gap,
        };
      case 'right':
        return {
          top: triggerRect.top + triggerRect.height / 2 - th / 2,
          left: triggerRect.right + gap,
        };
    }
  };

  const pos = tryPlacement(placement);
  top = pos.top;
  left = pos.left;

  // Auto-flip si no cabe
  const fitsHorizontally = left >= 8 && left + tw <= vw - 8;
  const fitsVertically = top >= 8 && top + th <= vh - 8;

  if (!fitsVertically || !fitsHorizontally) {
    const fallbacks: TooltipPlacement[] =
      placement === 'top' || placement === 'bottom'
        ? ['bottom', 'top', 'right', 'left']
        : ['right', 'left', 'bottom', 'top'];

    for (const fb of fallbacks) {
      const fbPos = tryPlacement(fb);
      const fH = fbPos.left >= 8 && fbPos.left + tw <= vw - 8;
      const fV = fbPos.top >= 8 && fbPos.top + th <= vh - 8;
      if (fH && fV) {
        top = fbPos.top;
        left = fbPos.left;
        finalPlacement = fb;
        break;
      }
    }
  }

  // Clamp como último recurso
  top = Math.max(8, Math.min(top, vh - th - 8));
  left = Math.max(8, Math.min(left, vw - tw - 8));

  return { top, left, finalPlacement };
}

/** Genera las coordenadas de la flecha según la posición final */
function arrowStyles(placement: TooltipPlacement): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
  };
  switch (placement) {
    case 'top':
      return {
        ...base,
        bottom: -5,
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid #1e293b',
      };
    case 'bottom':
      return {
        ...base,
        top: -5,
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom: '5px solid #1e293b',
      };
    case 'left':
      return {
        ...base,
        right: -5,
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: '5px solid #1e293b',
      };
    case 'right':
      return {
        ...base,
        left: -5,
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderRight: '5px solid #1e293b',
      };
  }
}

export function Tooltip({
  content,
  placement = 'top',
  delay = 300,
  maxWidth = 240,
  disabled = false,
  children,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [finalPlacement, setFinalPlacement] = useState<TooltipPlacement>(placement);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 9)}`);

  const show = useCallback(() => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  }, [disabled, content, delay]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current ?? undefined);
    setIsVisible(false);
  }, []);

  // Calcular posición ANTES del paint
  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const { top, left, finalPlacement: fp } = calcPosition(
      triggerRect,
      tooltipRef.current,
      placement,
      GAP
    );
    setPos({ top, left });
    setFinalPlacement(fp);
  }, [isVisible, placement]);

  // Click outside para mobile
  useEffect(() => {
    if (!isVisible) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      hide();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isVisible, hide]);

  // Cleanup timeout
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current ?? undefined);
  }, []);

  if (!content) return children;

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={isVisible ? hide : undefined}
      aria-describedby={isVisible ? tooltipId.current : undefined}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          id={tooltipId.current}
          className="pointer-events-none animate-[fadeIn_0.1s_ease-out]"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 60,
            maxWidth,
          }}
        >
          <div className="bg-secondary text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-normal">
            {content}
            <div style={arrowStyles(finalPlacement)} />
          </div>
        </div>
      )}
    </div>
  );
}
