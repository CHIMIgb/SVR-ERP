"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import type { PreferenciaTema } from "@/lib/tema";

const OPCIONES: { valor: PreferenciaTema; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: "light", etiqueta: "Tema claro", Icono: Sun },
  { valor: "dark", etiqueta: "Tema oscuro", Icono: Moon },
  { valor: "system", etiqueta: "Usar el tema del sistema", Icono: Monitor },
];

/**
 * Selector de tema de la barra superior.
 * Escritorio: tres botones (claro / oscuro / sistema).
 * Celular: un solo botón que rota entre las opciones, para no saturar la barra.
 * En la PWA se usa `conSistema={false}`: solo claro y oscuro — el tema del
 * teléfono es el DEFAULT, no una opción que el usuario pueda elegir.
 */
export default function ThemeToggle({ conSistema = true }: { conSistema?: boolean }) {
  const { preferencia, setPreferencia } = useTheme();

  const opciones = conSistema ? OPCIONES : OPCIONES.filter((o) => o.valor !== "system");
  const indiceActual = Math.max(0, opciones.findIndex((o) => o.valor === preferencia));
  const actual = opciones[indiceActual];
  const siguiente = opciones[(indiceActual + 1) % opciones.length];

  return (
    <>
      <div
        role="group"
        aria-label="Tema de la interfaz"
        className="hidden sm:flex items-center gap-0.5 p-1 rounded-xl bg-ui-100 border border-ui-200"
      >
        {opciones.map(({ valor, etiqueta, Icono }) => {
          const activo = preferencia === valor;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activo}
              aria-label={etiqueta}
              title={etiqueta}
              onClick={() => setPreferencia(valor)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                activo
                  ? "bg-surface text-ui-900 shadow-sm dark:bg-ui-300"
                  : "text-ui-500 hover:text-ui-900",
              )}
            >
              <Icono className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setPreferencia(siguiente.valor)}
        aria-label={`${actual.etiqueta}. Cambiar a: ${siguiente.etiqueta.toLowerCase()}`}
        title={actual.etiqueta}
        className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-ui-50 text-ui-500 hover:bg-ui-100 hover:text-ui-900 transition-colors cursor-pointer"
      >
        <actual.Icono className="w-5 h-5" />
      </button>
    </>
  );
}
