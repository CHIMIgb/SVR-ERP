'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastItem, ToastType, ToastPosition, ToastTransition, ToastOptions, ToastContextValue } from './Toast.types';
import { positionClasses, typeClasses, transitionClasses, toastClasses } from './Toast.styles';

/* ── Iconos por tipo ── */

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

/* ── Defaults ── */

const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_TRANSITION: ToastTransition = 'fadeIn';
const DEFAULT_DURATION = 4000;

/* ── Context ── */

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  dismiss: () => {},
  dismissAll: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Toast Component ── */

function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const pausedAt = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Animacion de progreso
  const tick = useCallback(() => {
    if (pausedAt.current !== null) return;
    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
    setProgress(remaining);
    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      onDismiss(toast.id);
    }
  }, [toast.duration, toast.id, onDismiss]);

  // Iniciar progreso
  useState(() => {
    startTime.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  });

  const handleMouseEnter = () => {
    pausedAt.current = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleMouseLeave = () => {
    if (pausedAt.current !== null) {
      const pausedDuration = Date.now() - pausedAt.current;
      startTime.current += pausedDuration;
      pausedAt.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const colors = typeClasses[toast.type];

  return (
    <div
      className={cn(
        toastClasses.base,
        colors.bg,
        colors.border,
        transitionClasses[toast.transition]
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      {typeIcons[toast.type]}
      <span className={toastClasses.message}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className={toastClasses.closeButton}
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>

      {/* Barra de progreso */}
      {toast.progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden bg-transparent">
          <div
            className={cn('h-full transition-none rounded-full', colors.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Provider ── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', options: ToastOptions = {}) => {
      const id = Date.now() + counterRef.current++;
      const toast: ToastItem = {
        id,
        message,
        type,
        position: options.position ?? DEFAULT_POSITION,
        transition: options.transition ?? DEFAULT_TRANSITION,
        duration: options.duration ?? DEFAULT_DURATION,
        progress: options.progress ?? true,
      };
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss basado en duracion (el progreso lo maneja visualmente)
      if (options.duration === 0) return; // No auto-dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration + 500); // +500ms buffer para la animacion
    },
    []
  );

  const success = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'success', opts), [showToast]);
  const error = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'error', opts), [showToast]);
  const warning = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'warning', opts), [showToast]);
  const info = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'info', opts), [showToast]);

  // Agrupar toasts por posicion
  const toastsByPosition = toasts.reduce<Record<string, ToastItem[]>>((acc, toast) => {
    (acc[toast.position] ??= []).push(toast);
    return acc;
  }, {});

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss, dismissAll }}>
      {children}

      {/* Renderizar contenedores por posicion */}
      {(Object.entries(toastsByPosition) as [ToastPosition, ToastItem[]][]).map(([position, items]) => (
        <div
          key={position}
          className={cn(
            'fixed z-[9999] flex flex-col gap-3 pointer-events-none',
            positionClasses[position]
          )}
        >
          {items.map((toast) => (
            <ToastItemComponent key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
}
