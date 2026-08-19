"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-[fadeScaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">{children}</div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
