"use client";

import { Download } from "lucide-react";
import { instalarApp } from "@/lib/pwa/instalar";

/**
 * Modal de instalación (petición del cliente 2026-11-11): se muestra en
 * CADA acceso a la PWA cuando la app NO está instalada en el dispositivo.
 * El botón «Instalar» CIERRA el modal de inmediato y lanza el DIÁLOGO
 * NATIVO si Chrome lo entregó — el modal nunca se queda colgado detrás
 * (aunque Chrome tenga enfriamiento y no lance el diálogo: la salida
 * alternativa es el menú ⋮ → «Instalar aplicación»).
 */
interface ModalInstalarProps {
  /** Cierra el modal (solo esta visita — vuelve en el próximo acceso). */
  onCerrar: () => void;
}

export default function ModalInstalar({ onCerrar }: ModalInstalarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl border border-ui-200">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/pwa-192.png" alt="" className="w-12 h-12 rounded-xl shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-black text-ui-900 leading-tight">Instalar aplicación</h2>
            <p className="text-xs text-ui-500 mt-1 leading-snug">
              SVR Constructora — en tu escritorio con el ícono del casco y disponible sin internet.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-ui-600 bg-ui-100 border border-ui-200 hover:bg-ui-200/60 transition-colors"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={() => {
              onCerrar();
              void instalarApp();
            }}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
