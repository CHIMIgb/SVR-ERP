'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modalClasses } from './Modal.styles';
import { Portal } from '@/components/ui/Portal';
import { Overlay } from '@/components/ui/Overlay';

type ModalSize = keyof typeof modalClasses.sizes;

export interface ModalProps {
  /** Estado de visibilidad del modal */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Contenido del modal */
  children: React.ReactNode;
  /** Tamano del modal */
  size?: ModalSize;
  /** Clase CSS adicional para el contenido */
  contentClassName?: string;
  /** Si es true, no cierra al hacer click en el overlay */
  persistent?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  contentClassName,
  persistent = false,
}: ModalProps) {
  // Cerrar con Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    },
    [onClose, persistent]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <Portal>
      <Overlay
        onClick={persistent ? undefined : onClose}
        blur
        className="z-[9998] p-2 sm:p-4"
      >
        <div
          className={cn(modalClasses.card, modalClasses.sizes[size], contentClassName)}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </Overlay>
    </Portal>
  );
}

/* ── Sub-componentes ── */

export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  /** Ocultar boton X de cerrar */
  hideClose?: boolean;
  className?: string;
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  hideClose = false,
  className,
}: ModalHeaderProps) {
  return (
    <div className={cn(modalClasses.header, className)}>
      <div className="min-w-0 flex-1">
        <h2 className={modalClasses.title}>{title}</h2>
        {subtitle && <p className={modalClasses.subtitle}>{subtitle}</p>}
      </div>
      {!hideClose && onClose && (
        <button
          onClick={onClose}
          className={modalClasses.closeButton}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn(modalClasses.body, className)}>
      {children}
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(modalClasses.footer, className)}>
      {children}
    </div>
  );
}
