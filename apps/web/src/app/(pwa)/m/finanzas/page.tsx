"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Wallet } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function FinanzasMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Finanzas"
      subtitulo="El flujo y movimientos llegan con la fase de finanzas móvil"
      icono={<Wallet className="w-10 h-10" />}
    />
  );
}
