"use client";

import React from 'react';
import {
  Modal as ModalBase,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Guardar',
  children,
}: ModalProps) {
  return (
    <ModalBase open={isOpen} onClose={onClose} size="md">
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        <div className="space-y-4">{children}</div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </ModalBase>
  );
}

// Reusable field components for modal forms
export function ModalField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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
