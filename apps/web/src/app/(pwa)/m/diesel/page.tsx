"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Fuel } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function DiselMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Diésel"
      subtitulo="El reparto y cargas de diésel llegan con la fase de diésel"
      icono={<Fuel className="w-10 h-10" />}
    />
  );
}
