"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { navDelRol } from "@/lib/pwa/rol-nav";
import { forzarVista } from "@/lib/pwa/dispositivo";

/**
 * Nav inferior por rol del shell móvil (plan §7b).
 * Pestañas ≥44px, activa por ruta, safe-area inferior, e interruptor
 * "Ver versión de escritorio" (override en localStorage).
 */
export function RoleNav({ pendientes = 0 }: { pendientes?: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const pestañas = navDelRol(user);

  return (
    <nav
      className="sticky bottom-0 z-30 bg-ui-900/70 backdrop-blur border-t border-white/10 px-2 pt-1"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {pendientes > 0 && (
        <p className="text-center text-[10px] font-bold text-amber-300 py-1">
          {pendientes} pendiente(s) por enviar
        </p>
      )}
      <ul className="flex items-stretch justify-around gap-1">
        {pestañas.map((p) => {
          const activa = pathname === p.ruta || pathname.startsWith(p.ruta + "/");
          const Icono = p.icono;
          return (
            <li key={p.ruta} className="flex-1 min-w-0">
              <Link
                href={p.ruta}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl transition-colors",
                  activa
                    ? "bg-primary/15 text-primary"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icono className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-bold leading-none truncate max-w-full px-1">
                  {p.etiqueta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Interruptor manual (plan §7a): se recuerda en localStorage */}
      <button
        type="button"
        onClick={() => {
          forzarVista("escritorio");
          window.location.href = "/dashboard";
        }}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Monitor className="w-3 h-3" />
        Ver versión de escritorio
      </button>
    </nav>
  );
}
