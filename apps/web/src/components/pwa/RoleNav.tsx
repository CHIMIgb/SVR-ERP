"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { navDelRol } from "@/lib/pwa/rol-nav";

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
      className="sticky bottom-0 z-30 bg-surface border-t border-ui-200 px-2 py-1"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}
    >
      {pendientes > 0 && (
        <p className="text-center text-[10px] font-bold text-warning py-1">
          {pendientes} pendiente(s) por enviar
        </p>
      )}
      <ul className="flex items-stretch justify-around gap-1">
        {pestañas.map((p) => {
          // "/m" (Inicio) solo es activa en su ruta EXACTA — si no, se marca en todas
  const activa = p.ruta === "/m" ? pathname === "/m" : pathname === p.ruta || pathname.startsWith(p.ruta + "/");
          const Icono = p.icono;
          return (
            <li key={p.ruta} className="flex-1 min-w-0">
              <Link
                href={p.ruta}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl transition-colors",
                  activa
                    ? "bg-primary/10 text-primary"
                    : "text-ui-500 hover:text-ui-700 hover:bg-ui-50",
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
    </nav>
  );
}
