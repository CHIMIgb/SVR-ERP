"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Calculator } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function CortedeldaMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Corte del día"
      subtitulo="El corte de caja del día llega con la fase de ventas móvil"
      icono={<Calculator className="w-10 h-10" />}
    />
  );
}
