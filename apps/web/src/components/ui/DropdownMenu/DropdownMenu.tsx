'use client';

import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────── */

interface DropdownMenuContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu subcomponents must be used inside <DropdownMenu>');
  return ctx;
}

/* ─────────────────────────────────────────────────────
   Root
   ───────────────────────────────────────────────────── */

export interface DropdownMenuProps {
  children: React.ReactNode;
  /** Abrir/cerrar controlado */
  open?: boolean;
  /** Callback al cambiar estado */
  onOpenChange?: (open: boolean) => void;
  /** Clase adicional en el wrapper */
  className?: string;
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  className,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === 'function' ? value(isOpen) : value;
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isOpen, onOpenChange]
  );

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [isOpen, setIsOpen]);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, setIsOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{ isOpen, setIsOpen, triggerRef, contentRef }}
    >
      <div className={cn('relative inline-flex', className)}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────
   Trigger
   ───────────────────────────────────────────────────── */

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  /** Renderizar como child (sin wrapper) */
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  className,
}: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu();

  const handleClick = () => setIsOpen((prev) => !prev);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        handleClick();
        const childOnClick = (children as React.ReactElement<Record<string, unknown>> & { props?: Record<string, unknown> }).props?.onClick;
        if (typeof childOnClick === 'function') childOnClick(e);
      },
      'aria-haspopup': 'menu' as const,
      'aria-expanded': isOpen,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer',
        'hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   Content
   ───────────────────────────────────────────────────── */

export type DropdownMenuAlign = 'start' | 'center' | 'end';

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: DropdownMenuAlign;
  /** Ancho fijo del menu */
  width?: number;
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = 'end',
  width = 200,
  className,
}: DropdownMenuContentProps) {
  const { isOpen, triggerRef, contentRef } = useDropdownMenu();
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;
    const cw = contentEl.offsetWidth;
    const vh = window.innerHeight;

    let left: number;
    switch (align) {
      case 'start':
        left = triggerRect.left;
        break;
      case 'center':
        left = triggerRect.left + triggerRect.width / 2 - cw / 2;
        break;
      case 'end':
      default:
        left = triggerRect.right - cw;
        break;
    }

    // Clamp horizontal
    left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));

    // Posición: debajo del trigger por defecto, arriba si no cabe
    const spaceBelow = vh - triggerRect.bottom - 8;
    const contentHeight = contentEl.offsetHeight;
    const openAbove = spaceBelow < contentHeight && triggerRect.top > contentHeight;

    const top = openAbove
      ? triggerRect.top - contentHeight - 8
      : triggerRect.bottom + 8;

    setPos({ top, left });
  }, [align, triggerRef, contentRef]);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Reposicionar al scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: Event) => {
      if (contentRef.current && e.target instanceof Node && contentRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [isOpen, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;
    const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])');

    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const idx = Array.from(items).indexOf(active as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          items[(idx + 1) % items.length]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          items[(idx - 1 + items.length) % items.length]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          items[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
      }
    };

    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [isOpen, contentRef]);

  // Focus first item on open
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    requestAnimationFrame(() => {
      const first = contentRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
      first?.focus();
    });
  }, [isOpen, contentRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-xl py-1.5',
        'animate-[fadeIn_0.1s_ease-out]',
        className
      )}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 60 }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Item
   ───────────────────────────────────────────────────── */

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  /** Icono a la izquierda */
  icon?: React.ReactNode;
  /** Texto de ayuda a la derecha */
  shortcut?: string;
  /** Variante destructiva (texto rojo) */
  destructive?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
  /** Callback al hacer click */
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({
  children,
  icon,
  shortcut,
  destructive = false,
  disabled = false,
  onClick,
  className,
}: DropdownMenuItemProps) {
  const { setIsOpen } = useDropdownMenu();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer',
        'focus:outline-none',
        disabled && 'opacity-40 cursor-not-allowed',
        destructive
          ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100',
        className
      )}
    >
      {icon && <span className="shrink-0 w-4 h-4">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <span className="text-xs text-slate-400 shrink-0 ml-4">{shortcut}</span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   Separator
   ───────────────────────────────────────────────────── */

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn('my-1.5 h-px bg-slate-100', className)}
    />
  );
}

/* ─────────────────────────────────────────────────────
   Label
   ───────────────────────────────────────────────────── */

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400',
        className
      )}
    >
      {children}
    </div>
  );
}
