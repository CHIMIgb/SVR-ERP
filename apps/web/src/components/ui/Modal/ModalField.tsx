'use client';

import { cn } from '@/lib/utils';

export interface ModalFieldProps {
  /** Label del campo */
  label: string;
  /** Campo obligatorio */
  required?: boolean;
  /** Texto de ayuda debajo del campo */
  hint?: string;
  /** Mensaje de error */
  error?: string;
  /** Contenido del campo */
  children: React.ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

export function ModalField({
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: ModalFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

/* ── Clases reutilizables para inputs dentro de modales ── */

export const modalInputClass =
  'w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

export const modalSelectClass =
  'w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 appearance-none focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

export const modalTextareaClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed';
