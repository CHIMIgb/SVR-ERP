"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { CreditCard } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function PuntodeventaMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Punto de venta"
      subtitulo="El POS de la criba llega con la fase de ventas móvil"
      icono={<CreditCard className="w-10 h-10" />}
    />
  );
}
