'use client';

import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { confirmDialogClasses } from './ConfirmDialog.styles';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  /** Estado de visibilidad */
  open: boolean;
  /** Callback de cierre */
  onClose: () => void;
  /** Callback de confirmacion */
  onConfirm: () => void;
  /** Titulo del dialogo */
  title: string;
  /** Mensaje/descripcion */
  message: string;
  /** Label del boton de confirmar */
  confirmLabel?: string;
  /** Label del boton de cancelar */
  cancelLabel?: string;
  /** Variante visual */
  variant?: ConfirmVariant;
  /** Estado de carga del boton confirmar */
  loading?: boolean;
  /** Ancho del modal */
  size?: 'sm' | 'md';
  /** Espacio a omitir en el lado izquierdo */
  offsetLeft?: number;
}

const variantIcons: Record<ConfirmVariant, React.ReactNode> = {
  danger: <Trash2 size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const variantIconClasses: Record<ConfirmVariant, string> = {
  danger: confirmDialogClasses.iconDanger,
  warning: confirmDialogClasses.iconWarning,
  info: confirmDialogClasses.iconInfo,
};

const variantButtonClass: Record<ConfirmVariant, 'danger' | 'primary' | 'secondary'> = {
  danger: 'danger',
  warning: 'primary',
  info: 'secondary',
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  size = 'sm',
  offsetLeft,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      persistent={loading}
      offsetLeft={offsetLeft}
    >
      <ModalHeader title={title} onClose={onClose} hideClose={loading} />

      <ModalBody>
        <div className={confirmDialogClasses.content}>
          <div
            className={cn(confirmDialogClasses.icon, variantIconClasses[variant])}
          >
            {variantIcons[variant]}
          </div>
          <div className={confirmDialogClasses.textWrapper}>
            <p className={confirmDialogClasses.message}>{message}</p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variantButtonClass[variant]}
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
