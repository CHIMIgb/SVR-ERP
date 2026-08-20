"use client";

import type { ReactNode } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSidebar } from './SidebarContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  children: ReactNode;
}

export default function LayoutModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Guardar',
  children,
}: ModalProps) {
  const { width } = useSidebar();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
      offsetLeft={width}
    >
      <ModalHeader
        title={title}
        onClose={onClose}
      />
      <ModalBody>
        <div className="space-y-4">
          {children}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Reusable field components for modal forms
export function ModalField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-primary/50 transition-all bg-slate-50 focus:bg-white';

export const selectClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-primary/50 transition-all bg-slate-50 focus:bg-white appearance-none';

