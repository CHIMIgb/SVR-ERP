"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * Aviso de instalación (petición del cliente: si la PWA NO está instalada,
 * el aviso sale en cada acceso desde el navegador; una vez instalada —
 * abierta en modo standalone — desaparece).
 *
 * - `display-mode: standalone` = la app ya está instalada → no se muestra.
 * - Si el navegador entrega `beforeinstallprompt` (requiere HTTPS), el botón
 *   lanza el prompt nativo; si no (HTTP en dev), instruye el menú ⋮ → Instalar.
 * - La ✕ lo oculta solo por la sesión actual (sessionStorage).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function BannerInstalar() {
  const [instalada, setInstalada] = useState(true); // default: oculta hasta verificar
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  // cerrado por sesión se lee en el initializer (sin setState síncrono en effect)
  const [cerrada, setCerrada] = useState(() => {
    try { return sessionStorage.getItem("svr-instalar-oculto") === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ¿ya está instalada/abierta como app? (standalone = instalada)
    const revisar = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setInstalada(standalone);
    };
    revisar();

    // prompt nativo (solo en contextos seguros)
    const capturar = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturar);

    return () => window.removeEventListener("beforeinstallprompt", capturar);
  }, []);

  const cerrarSesion = () => {
    try { sessionStorage.setItem("svr-instalar-oculto", "1"); } catch { /* noop */ }
    setCerrada(true);
  };

  if (instalada || cerrada) return null;

  const instalar = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      return;
    }
    // sin prompt nativo (HTTP en dev): instrucción del menú
    window.alert("Para instalar: menú del navegador (⋮) → «Instalar aplicación» o «Añadir a pantalla de inicio»");
  };

  return (
    <div className="px-4 pt-4">
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-ui-900">Instala SVR en tu teléfono</p>
          <p className="text-xs text-ui-500 mt-0.5">
            {promptEvent
              ? "Instálala para abrir directo y trabajar sin internet."
              : "Menú del navegador (⋮) → «Instalar aplicación»."}
          </p>
          <button
            type="button"
            onClick={instalar}
            className="mt-2 text-xs font-black text-primary hover:text-primary-dark uppercase tracking-widest"
          >
            {promptEvent ? "Instalar ahora" : "Cómo instalar"}
          </button>
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          aria-label="Cerrar aviso"
          className="text-ui-400 hover:text-ui-600 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
