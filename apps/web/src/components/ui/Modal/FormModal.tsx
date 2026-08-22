'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  type ModalProps,
} from './Modal';

export interface FormModalProps extends Omit<ModalProps, 'children'> {
  /** Titulo del modal */
  title: string;
  /** Subtitulo opcional */
  subtitle?: string;
  /** Contenido del formulario */
  children: React.ReactNode;
  /** Label del boton de guardar */
  submitLabel?: string;
  /** Label del boton de cancelar */
  cancelLabel?: string;
  /** Callback al enviar el formulario */
  onSubmit?: () => void;
  /** Estado de carga del boton guardar */
  isSubmitting?: boolean;
  /** Deshabilitar boton guardar */
  submitDisabled?: boolean;
  /** Ocultar footer con botones de accion */
  hideFooter?: boolean;
  /** Callback de cierre alias para onClose */
  onCancel?: () => void;
}

export function FormModal({
  title,
  subtitle,
  children,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  hideFooter = false,
  onCancel,
  ...modalProps
}: FormModalProps) {
  const handleClose = onCancel || modalProps.onClose;

  return (
    <Modal {...modalProps} size={modalProps.size || 'lg'}>
      <ModalHeader
        title={title}
        subtitle={subtitle}
        onClose={handleClose}
      />

      <ModalBody>
        <form
          id={modalProps.open ? 'form-modal' : undefined}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className="space-y-4">
            {children}
          </div>
        </form>
      </ModalBody>

      {!hideFooter && (
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={submitDisabled || isSubmitting}
            icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : undefined}
          >
            {submitLabel}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}
