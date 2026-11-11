"use client";

import { Home } from "lucide-react";

/**
 * Placeholder de pantalla de la base (plan §8.5) — solo título; el módulo
 * real llega con su fase. Reusa `PantallaPlaceholder`? — este archivo usa el
 * componente compartido.
 */
import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";

export default function InicioMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Inicio"
      subtitulo="Tu pantalla de inicio llegará con el dashboard móvil del rol"
      icono={<Home className="w-10 h-10" />}
    />
  );
}
