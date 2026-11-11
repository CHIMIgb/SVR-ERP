"use client";

import { Download } from "lucide-react";

/**
 * Modal de instalación AUTOMÁTICO (petición del cliente 2026-11-11):
 * sale SOLO cada vez que se accede desde el navegador cuando la app NO está
 * instalada (el check de `standalone` lo hace el layout). Al pulsar
 * «Instalar» lanza el DIÁLOGO NATIVO del navegador (beforeinstallprompt →
 * prompt()), como en el ejemplo del cliente. Requiere certificado de
 * confianza en el teléfono (certs mkcert de la IP + rootCA instalado).
 */
interface ModalInstalarProps {
  promptEvent: { prompt: () => Promise<void> } | null;
  /** Lanza el prompt nativo y avisa si no está disponible (HTTP en dev). */
  onInstalar: () => void;
  /** Cierra el modal (solo esta visita — volverá en el próximo acceso). */
  onCancelar: () => void;
  /** URL del origen actual (para mostrarla, como en el ejemplo). */
  origen?: string;
}

export default function ModalInstalar({ promptEvent, onInstalar, onCancelar, origen }: ModalInstalarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl border border-ui-200">
        <h2 className="text-lg font-black text-ui-900 mb-4">Instalar aplicación</h2>

        <div className="flex items-center gap-3 bg-canvas rounded-2xl p-4 border border-ui-100">
          {/* Ícono de marca SVR */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/pwa-192.png" alt="" className="w-12 h-12 rounded-xl" />
          <div className="min-w-0">
            <p className="text-sm font-black text-ui-900 leading-tight">SVR Constructora</p>
            <p className="text-xs text-ui-500 truncate">{origen}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onInstalar}
            className="px-5 py-2 rounded-xl text-sm font-black text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Instalar
          </button>
        </div>

        {!promptEvent && (
          <p className="text-[11px] text-ui-400 mt-4 leading-snug">
            Si «Instalar» no abre el diálogo: menú del navegador (⋮) → «Instalar
            aplicación». (Requiere HTTPS con certificado de confianza.)
          </p>
        )}
      </div>
    </div>
  );
}
